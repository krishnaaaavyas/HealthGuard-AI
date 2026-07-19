import os
import sys
import json
import hashlib
import argparse
from datetime import datetime, timezone
import pandas as pd
import numpy as np

# Variable dictionary mapping raw codes to descriptive names
MAPPED_VARIABLES = {
    "v1": "participant_id",
    "v2": "residence",
    "v3": "state_code",
    "v4": "age_years",
    "v5": "sex",
    "v6": "education",
    "v7": "occupation",
    "v8": "bmi",
    "v9": "waist_cm",
    "v10": "systolic_bp",
    "v11": "diastolic_bp",
    "v36": "diabetes_composite",
    "v37": "prediabetes",
    "v38": "hypertension",
    "v39": "abdominal_obesity",
    "v40": "generalized_obesity",
    "v41": "dyslipidaemia"
}

# Leakage Policy definitions
ALLOWED_CORE = ["v4", "v8", "v9", "age_years", "bmi", "waist_cm"]
ALLOWED_ENHANCED = ["v4", "v8", "v9", "v10", "v11", "age_years", "bmi", "waist_cm", "systolic_bp", "diastolic_bp"]
ALLOWED_SENSITIVITY = ["v5", "sex"]

FORBIDDEN_COLUMNS = [
    "v36", "v37", "v38", "v39", "v40", "v41",
    "diabetes_composite", "prediabetes", "hypertension",
    "abdominal_obesity", "generalized_obesity", "dyslipidaemia"
]

FORBIDDEN_KEYWORDS = ["glucose", "hba1c", "sugar", "ogtt", "fasting_blood"]

def validate_feature_policy(predictors: list, column_labels: dict = None) -> bool:
    """
    Validates a list of predictor columns against the Leakage Policy.
    Raises ValueError if any leakage or forbidden features are detected.
    """
    for col in predictors:
        col_str = str(col).lower().strip()
        # Direct column name checks
        if col_str in FORBIDDEN_COLUMNS:
            raise ValueError(f"Feature Leakage Detected: Column '{col}' is forbidden under target/outcome leakage rules.")
        
        # Keyword checks on column name
        if any(kw in col_str for kw in FORBIDDEN_KEYWORDS):
            raise ValueError(f"Feature Leakage Detected: Column '{col}' contains forbidden glucose/laboratory outcome keywords.")
        
        # Check column label if metadata is available
        if column_labels and col in column_labels:
            label_str = str(column_labels[col]).lower()
            if any(kw in label_str for kw in FORBIDDEN_KEYWORDS):
                raise ValueError(f"Feature Leakage Detected: Column '{col}' label ('{column_labels[col]}') contains forbidden keywords.")
    return True

def calculate_checksum(file_path: str) -> str:
    """Calculates SHA-256 checksum of a file."""
    sha256 = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(8192):
            sha256.update(chunk)
    return sha256.hexdigest()

def main():
    parser = argparse.ArgumentParser(description="Read-only Audit and Governance Pipeline for ICMR-INDIAB Sample")
    parser.add_argument("--data-path", required=True, help="Path to the raw Stata (.dta) dataset file")
    parser.add_argument("--output-dir", required=True, help="Directory to save audit output aggregates")
    
    args = parser.parse_args()
    
    # Check if input file exists
    if not os.path.exists(args.data_path):
        print(f"Error: Input dataset file not found at path: {args.data_path}", file=sys.stderr)
        sys.exit(1)
        
    os.makedirs(args.output_dir, exist_ok=True)
    
    # Calculate dataset fingerprint
    file_size = os.path.getsize(args.data_path)
    file_checksum = calculate_checksum(args.data_path)
    filename = os.path.basename(args.data_path)
    
    pyreadstat_version = "unavailable"
    try:
        import pyreadstat
        pyreadstat_version = pyreadstat.__version__
        df, meta = pyreadstat.read_dta(args.data_path)
        column_labels = meta.column_names_to_labels if meta else {}
        value_labels = meta.variable_value_labels if meta else {}
    except Exception as e:
        print(f"Pyreadstat unavailable or failed to load. Falling back to pandas standard Stata reader. Details: {e}")
        df = pd.read_stata(args.data_path)
        column_labels = {}
        value_labels = {}
        
    # Document raw characteristics
    row_count = len(df)
    col_count = len(df.columns)
    
    # Check target and map columns
    # We rename columns internally for standard checks, mapping both raw 'vXX' and descriptive 'descr' names
    df_internal = df.copy()
    rename_dict = {}
    reverse_map = {}
    for code, desc in MAPPED_VARIABLES.items():
        if code in df_internal.columns:
            rename_dict[code] = desc
            reverse_map[desc] = code
        elif desc in df_internal.columns:
            rename_dict[desc] = desc
            reverse_map[desc] = desc
            
    df_internal = df_internal.rename(columns=rename_dict)
    
    # Audit Checks: Participant IDs
    id_col = "participant_id" if "participant_id" in df_internal.columns else None
    if id_col:
        unique_ids = int(df_internal[id_col].nunique())
        duplicate_ids = int((df_internal[id_col].value_counts() > 1).sum())
        missing_ids = int(df_internal[id_col].isna().sum())
    else:
        # Try raw v1
        unique_ids = 0
        duplicate_ids = 0
        missing_ids = row_count
        
    # Column missingness
    missingness_list = []
    for col in df.columns:
        m_count = int(df[col].isna().sum())
        m_pct = float(m_count / row_count) if row_count > 0 else 0.0
        missingness_list.append({
            "column_name": col,
            "missing_count": m_count,
            "missing_percentage": m_pct,
            "completeness_percentage": 1.0 - m_pct
        })
    missingness_df = pd.DataFrame(missingness_list)
    missingness_csv_path = os.path.join(args.output_dir, "icmr_sample_missingness.csv")
    missingness_df.to_csv(missingness_csv_path, index=False)
    
    # Target variables distributions (diabetes_composite / v36)
    target_col = "diabetes_composite" if "diabetes_composite" in df_internal.columns else "v36"
    target_dist = {}
    target_missing = 0
    unexpected_target_codes = []
    
    if target_col in df_internal.columns:
        target_series = df_internal[target_col]
        target_missing = int(target_series.isna().sum())
        # value counts
        for k, v in target_series.value_counts(dropna=False).items():
            target_dist[str(k)] = int(v)
            # unexpected code detection
            if pd.notna(k) and k not in [0, 1, 0.0, 1.0]:
                unexpected_target_codes.append(str(k))
    
    # Mapped summary stats
    numeric_vars = ["age_years", "bmi", "waist_cm", "systolic_bp", "diastolic_bp"]
    stats_dict = {}
    for var in numeric_vars:
        if var in df_internal.columns:
            series = pd.to_numeric(df_internal[var], errors="coerce")
            if not series.empty:
                stats_dict[var] = {
                    "minimum": float(series.min()) if pd.notna(series.min()) else None,
                    "maximum": float(series.max()) if pd.notna(series.max()) else None,
                    "mean": float(series.mean()) if pd.notna(series.mean()) else None,
                    "median": float(series.median()) if pd.notna(series.median()) else None,
                    "data_type": str(series.dtype)
                }
                
    # Categorical counts
    cat_vars = ["residence", "sex", "state_code", "education", "occupation"]
    cat_dict = {}
    for var in cat_vars:
        if var in df_internal.columns:
            series = df_internal[var]
            counts = series.value_counts(dropna=False)
            cat_dict[var] = {str(k): int(v) for k, v in counts.items()}
            
    # Constant and near-constant columns (unmapped columns checked on raw df)
    constant_cols = []
    near_constant_cols = []
    for col in df.columns:
        vc = df[col].value_counts(normalize=True, dropna=False)
        if not vc.empty:
            max_ratio = vc.iloc[0]
            if len(vc) == 1:
                constant_cols.append(col)
            elif max_ratio >= 0.99:
                near_constant_cols.append(col)
                
    # Unexpected category codes (checks for residence and sex)
    unexpected_cat_codes = {}
    if "residence" in df_internal.columns:
        res_vals = df_internal["residence"].unique()
        # Residence should normally map to rural/urban or 1/2. We inspect values outside standard expected sets.
        # Expecting either string containing rural/urban or numeric 1/2
        unexpected = [str(x) for x in res_vals if pd.notna(x) and not any(s in str(x).lower() for s in ["rural", "urban", "1", "2"])]
        if unexpected:
            unexpected_cat_codes["residence"] = unexpected
            
    if "sex" in df_internal.columns:
        sex_vals = df_internal["sex"].unique()
        # Sex should normally map to male/female or 1/2.
        unexpected = [str(x) for x in sex_vals if pd.notna(x) and not any(s in str(x).lower() for s in ["male", "female", "1", "2"])]
        if unexpected:
            unexpected_cat_codes["sex"] = unexpected
            
    # Candidate-feature completeness
    completeness_dict = {}
    for var in numeric_vars + cat_vars:
        if var in df_internal.columns:
            pct_missing = df_internal[var].isna().sum() / row_count if row_count > 0 else 1.0
            completeness_dict[var] = 1.0 - pct_missing
            
    # Plausibility checks
    plausibility_flags = {
        "age_outside_20_120": 0,
        "bmi_outside_10_80": 0,
        "waist_outside_30_250": 0,
        "systolic_outside_40_300": 0,
        "diastolic_outside_20_200": 0,
        "systolic_le_diastolic": 0
    }
    
    if "age_years" in df_internal.columns:
        ages = pd.to_numeric(df_internal["age_years"], errors="coerce")
        plausibility_flags["age_outside_20_120"] = int(((ages < 20) | (ages > 120)).sum())
        
    if "bmi" in df_internal.columns:
        bmis = pd.to_numeric(df_internal["bmi"], errors="coerce")
        plausibility_flags["bmi_outside_10_80"] = int(((bmis < 10) | (bmis > 80)).sum())
        
    if "waist_cm" in df_internal.columns:
        waists = pd.to_numeric(df_internal["waist_cm"], errors="coerce")
        plausibility_flags["waist_outside_30_250"] = int(((waists < 30) | (waists > 250)).sum())
        
    if "systolic_bp" in df_internal.columns:
        sys_bp = pd.to_numeric(df_internal["systolic_bp"], errors="coerce")
        plausibility_flags["systolic_outside_40_300"] = int(((sys_bp < 40) | (sys_bp > 300)).sum())
        
    if "diastolic_bp" in df_internal.columns:
        dia_bp = pd.to_numeric(df_internal["diastolic_bp"], errors="coerce")
        plausibility_flags["diastolic_outside_20_200"] = int(((dia_bp < 20) | (dia_bp > 200)).sum())
        
    if "systolic_bp" in df_internal.columns and "diastolic_bp" in df_internal.columns:
        sys_bp = pd.to_numeric(df_internal["systolic_bp"], errors="coerce")
        dia_bp = pd.to_numeric(df_internal["diastolic_bp"], errors="coerce")
        plausibility_flags["systolic_le_diastolic"] = int((sys_bp <= dia_bp).sum())
        
    # Write aggregated Outputs
    
    # 1. icmr_sample_audit.json
    audit_json = {
        "fingerprint": {
            "filename": filename,
            "file_size_bytes": file_size,
            "sha256_checksum": file_checksum,
            "audit_timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            "python_version": sys.version,
            "pandas_version": pd.__version__,
            "pyreadstat_version": pyreadstat_version
        },
        "structure": {
            "row_count": row_count,
            "column_count": col_count,
            "unique_participant_ids": unique_ids,
            "duplicate_participant_ids": duplicate_ids,
            "missing_participant_ids": missing_ids
        },
        "target_audit": {
            "target_variable": target_col,
            "missing_count": target_missing,
            "missing_percentage": float(target_missing / row_count) if row_count > 0 else 0.0,
            "distribution": target_dist,
            "unexpected_codes": unexpected_target_codes
        },
        "governance": {
            "constant_columns": constant_cols,
            "near_constant_columns": near_constant_cols,
            "candidate_feature_completeness": completeness_dict
        }
    }
    
    with open(os.path.join(args.output_dir, "icmr_sample_audit.json"), "w") as f:
        json.dump(audit_json, f, indent=2)
        
    # 2. icmr_sample_categories.json
    with open(os.path.join(args.output_dir, "icmr_sample_categories.json"), "w") as f:
        json.dump({
            "categorical_value_counts": cat_dict,
            "stats_summary": stats_dict,
            "unexpected_category_codes": unexpected_cat_codes
        }, f, indent=2)
        
    # 3. icmr_sample_plausibility.json
    with open(os.path.join(args.output_dir, "icmr_sample_plausibility.json"), "w") as f:
        json.dump({
            "plausibility_flags": plausibility_flags
        }, f, indent=2)
        
    print("Aggregate audit reports generated successfully.")

if __name__ == "__main__":
    main()
