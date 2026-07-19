# Dataset Card: ICMR-INDIAB Authentic Research Sample (500-Row Cohort)

## 1. Study and Dataset Origin
- **Parent Study**: The Indian Council of Medical Research–India Diabetes (ICMR-INDIAB) Study.
- **Study Design**: A community-based, cross-sectional epidemiological survey of adults aged 20 years and older in India.
- **Sampling Scheme**: Stratified, multistage sampling representing urban and rural areas across multiple states.
- **Authenticity**: This dataset represents an authentic local research sample of the ICMR-INDIAB cohort, supplied strictly under access control agreements.

## 2. Sample Characteristics & Distribution (Observed in Audit)
- **Local Sample Size**: 500 rows.
- **Geographic & Residence Distribution**:
  - State representation: Indian regional codes corresponding to surveyed states.
  - Residence type: Categorized into `rural` and `urban` populations.
- **Design Type**: Cross-sectional baseline measurements. No longitudinal follow-up is present in this cohort.

## 3. Variable Dictionary & Target Definition
- **Mapped Variables**:
  - `v1` / `participant_id`: Unique research subject ID.
  - `v2` / `residence`: Rural or urban indicator.
  - `v3` / `state_code`: Numeric regional code.
  - `v4` / `age_years`: Subject age.
  - `v5` / `sex`: Male or female.
  - `v6` / `education`: Level of formal education.
  - `v7` / `occupation`: Type of employment category.
  - `v8` / `bmi`: Calculated Body Mass Index.
  - `v9` / `waist_cm`: Waist circumference in centimeters.
  - `v10` / `systolic_bp`: Systolic blood pressure (mmHg).
  - `v11` / `diastolic_bp`: Diastolic blood pressure (mmHg).
  - `v36` / `diabetes_composite`: The binary target outcome (1 = diabetes, 0 = no diabetes).
  - `v37` / `prediabetes`: Prediabetic classification.
  - `v38` / `hypertension`: Hypertensive status.
  - `v39` / `abdominal_obesity`: Abdominal obesity status.
  - `v40` / `generalized_obesity`: Generalized obesity status.
  - `v41` / `dyslipidaemia`: Dyslipidaemic status.
- **Target Outcome (`v36`)**: Defined as a composite of self-reported diabetes, fasting plasma glucose (FPG) levels, and/or 2-hour oral glucose tolerance test (OGTT) values matching WHO criteria.

## 4. Quality Control & Missingness
- **Parent-Study Quality Control**: Measurements were collected using standardized questionnaires, calibrated digital blood pressure monitors, standardized anthropometry protocols, and certified venous plasma assays.
- **Local Sample Missingness**:
  - Participant IDs are fully populated (zero missingness).
  - Target variables (`v36`) contain no missing values in this sample.
  - Predictors (`v8`, `v9`, `v10`, `v11`) exhibit minimal missingness (less than 2% in the audited cohort).
- **Audit Findings**: No imputation or repair was carried out on missing values; they are treated as missing throughout the audit script.

## 5. Governance & Limitations
- **Permitted Research Role**: Pre-laboratory screening prioritization research only. This model card acts as a verification safeguard.
- **Prohibited Claims**: No clinical diagnostic claims, prescription recommendations, or claims of nationwide representation are allowed.
- **Data Access & License Status**: **Marked for Review**. The raw `.dta` file remains external to version control and cannot be committed. Access is governed under ICMR academic access rules.
