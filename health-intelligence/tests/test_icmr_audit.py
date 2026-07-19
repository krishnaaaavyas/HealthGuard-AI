import os
import json
import tempfile
import unittest
import hashlib
import pandas as pd
import numpy as np
from training.audit_icmr_sample import (
    validate_feature_policy,
    calculate_checksum,
    MAPPED_VARIABLES
)

class TestICMRAudit(unittest.TestCase):
    
    def setUp(self):
        self.test_dir = tempfile.TemporaryDirectory()
        
    def tearDown(self):
        self.test_dir.cleanup()
        
    def test_missing_file_fails(self):
        """Asserts that running audit on a missing file exits or raises an error."""
        # We can test the helper directly or verify that it raises / exits.
        # Since we use subprocess or direct call:
        import sys
        from unittest.mock import patch
        
        # Test command line parsing fails on missing file
        with patch.object(sys, "argv", ["audit_icmr_sample.py", "--data-path", "non_existent.dta", "--output-dir", self.test_dir.name]):
            with self.assertRaises(SystemExit) as cm:
                from training import audit_icmr_sample
                audit_icmr_sample.main()
            self.assertEqual(cm.exception.code, 1)

    def test_forbidden_feature_detection(self):
        """Validates that Leakage Policy blocks forbidden variables and keywords."""
        # Valid list
        valid_predictors = ["v4", "v8", "v9"]
        self.assertTrue(validate_feature_policy(valid_predictors))
        
        # Forbidden code
        with self.assertRaises(ValueError) as cm:
            validate_feature_policy(["v4", "v36"])
        self.assertIn("v36", str(cm.exception))
        
        # Forbidden descriptive name
        with self.assertRaises(ValueError) as cm:
            validate_feature_policy(["diabetes_composite"])
        self.assertIn("diabetes_composite", str(cm.exception))
        
        # Forbidden keyword in column name
        with self.assertRaises(ValueError) as cm:
            validate_feature_policy(["fasting_glucose_level"])
        self.assertIn("fasting_glucose_level", str(cm.exception))
        
        # Forbidden keyword in metadata label
        labels = {"col_x": "venous hba1c percentage"}
        with self.assertRaises(ValueError) as cm:
            validate_feature_policy(["col_x"], column_labels=labels)
        self.assertIn("col_x", str(cm.exception))

    def test_checksum_generation(self):
        """Verifies correct SHA-256 checksum generation for a file."""
        temp_file_path = os.path.join(self.test_dir.name, "test_checksum.txt")
        content = b"HealthGuard governance pipeline test content"
        with open(temp_file_path, "wb") as f:
            f.write(content)
            
        expected_hash = hashlib.sha256(content).hexdigest()
        self.assertEqual(calculate_checksum(temp_file_path), expected_hash)

    def test_audit_logic_on_mock_stata(self):
        """Creates a mock Stata file, runs audit checks, and asserts outputs are aggregates only."""
        mock_data = {
            # participant_id: v1
            "v1": ["ID100", "ID200", "ID300", "ID100", "ID400"] + [f"ID{i}" for i in range(5, 100)],
            # residence: v2
            "v2": ["rural", "urban", "rural", "rural", "invalid_residence"] + ["rural"] * 95,
            # state_code: v3
            "v3": [10, 20, 10, 10, 30] + [10] * 95,
            # age_years: v4
            "v4": [45, 17, 130, 45, 55] + [50] * 95,
            # sex: v5
            "v5": ["male", "female", "male", "male", "other"] + ["male"] * 95,
            # bmi: v8
            "v8": [23.5, 9.2, 85.0, 23.5, np.nan] + [22.0] * 95,
            # waist_cm: v9
            "v9": [88.0, 25.0, 260.0, 88.0, 95.0] + [85.0] * 95,
            # systolic_bp: v10
            "v10": [120, 190, 35, 120, 150] + [120] * 95,
            # diastolic_bp: v11
            "v11": [80, 205, 25, 80, 160] + [80] * 95,
            # diabetes_composite: v36
            "v36": [0, 1, 0, 0, 99] + [0] * 95,
            # constant column
            "const_col": [1.0] * 100,
            # near-constant column
            "near_const_col": [2.0] * 99 + [3.0]
        }
        df_mock = pd.DataFrame(mock_data)
        
        # Save as Stata .dta file (Stata format 117 allows longer varnames/strings, but standard is fine)
        stata_path = os.path.join(self.test_dir.name, "mock_icmr_sample.dta")
        df_mock.to_stata(stata_path, write_index=False, version=117)
        
        # Run audit main
        import sys
        from unittest.mock import patch
        from training import audit_icmr_sample
        
        output_dir = os.path.join(self.test_dir.name, "audit_output")
        
        with patch.object(sys, "argv", ["audit_icmr_sample.py", "--data-path", stata_path, "--output-dir", output_dir]):
            audit_icmr_sample.main()
            
        # Verify outputs exist
        audit_json_path = os.path.join(output_dir, "icmr_sample_audit.json")
        missing_csv_path = os.path.join(output_dir, "icmr_sample_missingness.csv")
        categories_json_path = os.path.join(output_dir, "icmr_sample_categories.json")
        plausibility_json_path = os.path.join(output_dir, "icmr_sample_plausibility.json")
        
        self.assertTrue(os.path.exists(audit_json_path))
        self.assertTrue(os.path.exists(missing_csv_path))
        self.assertTrue(os.path.exists(categories_json_path))
        self.assertTrue(os.path.exists(plausibility_json_path))
        
        # Load and verify no participant-level data leakage exists in outputs
        with open(audit_json_path, "r") as f:
            audit_data = json.load(f)
            
        with open(categories_json_path, "r") as f:
            cat_data = json.load(f)
            
        with open(plausibility_json_path, "r") as f:
            plaus_data = json.load(f)
            
        # 1. Structure Verification
        self.assertEqual(audit_data["structure"]["row_count"], 100)
        self.assertEqual(audit_data["structure"]["unique_participant_ids"], 99)
        self.assertEqual(audit_data["structure"]["duplicate_participant_ids"], 1) # ID100 duplicated
        
        # 2. Unexpected Target Code (99)
        self.assertIn("99", audit_data["target_audit"]["unexpected_codes"])
        
        # 3. Constant and near-constant columns
        self.assertIn("const_col", audit_data["governance"]["constant_columns"])
        self.assertIn("near_const_col", audit_data["governance"]["near_constant_columns"])
        
        # 4. Plausibility flag counts
        p_flags = plaus_data["plausibility_flags"]
        self.assertEqual(p_flags["age_outside_20_120"], 2) # 17 and 130
        self.assertEqual(p_flags["bmi_outside_10_80"], 2) # 9.2 and 85.0
        self.assertEqual(p_flags["waist_outside_30_250"], 2) # 25.0 and 260.0
        self.assertEqual(p_flags["systolic_outside_40_300"], 1) # 35
        self.assertEqual(p_flags["diastolic_outside_20_200"], 1) # 205 is outside [20, 200]
        self.assertEqual(p_flags["systolic_le_diastolic"], 2) # (190<=205, 150<=160)
        
        # 5. Unexpected categories
        self.assertIn("invalid_residence", cat_data["unexpected_category_codes"]["residence"])
        self.assertIn("other", cat_data["unexpected_category_codes"]["sex"])
        
        # 6. Leakage & Aggregates checks: No raw lists of participant values
        # Check that no array of length 5 of raw values of residence or IDs is exported
        for key in ["structure", "target_audit", "governance"]:
            for subkey, val in audit_data[key].items():
                if isinstance(val, list):
                    # Lists are only metadata lists like column names or code strings, not raw datasets
                    self.assertTrue(len(val) < 5 or subkey == "constant_columns" or subkey == "near_constant_columns")

if __name__ == "__main__":
    unittest.main()
