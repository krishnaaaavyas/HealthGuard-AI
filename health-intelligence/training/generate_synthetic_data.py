import pandas as pd
import numpy as np
import os

# Seed for reproducibility
np.random.seed(42)

def generate_data(num_samples=10000):
    ages = np.random.randint(18, 90, size=num_samples)
    genders = np.random.choice([0, 1, 2], size=num_samples, p=[0.48, 0.48, 0.04]) # 0=male, 1=female, 2=other
    heights = np.random.normal(168, 10, size=num_samples) # cm
    weights = (heights - 100) * np.random.uniform(0.7, 1.4, size=num_samples)
    bmis = weights / ((heights / 100.0) ** 2)

    smokings = np.random.choice([0, 1, 2], size=num_samples, p=[0.6, 0.25, 0.15])
    exercises = np.random.choice([0, 1, 2, 3], size=num_samples, p=[0.2, 0.3, 0.35, 0.15])

    # Diabetics probability modeling
    is_diabetic_prob = 0.15 + (ages / 200.0) + (bmis / 100.0) - (exercises * 0.05)
    is_diabetic_prob = np.clip(is_diabetic_prob, 0.05, 0.95)
    is_diabetic = np.random.binomial(1, is_diabetic_prob)

    fbs = np.zeros(num_samples)
    hba1c = np.zeros(num_samples)

    for i in range(num_samples):
        if is_diabetic[i] == 1:
            fbs[i] = np.random.normal(140, 40)
            hba1c[i] = np.random.normal(6.8, 1.2)
        else:
            fbs[i] = np.random.normal(90, 10)
            hba1c[i] = np.random.normal(5.1, 0.3)

    fbs = np.clip(fbs, 50, 400)
    hba1c = np.clip(hba1c, 3.0, 18.0)

    # Blood pressure
    systolic = np.random.normal(120, 15, size=num_samples) + (bmis - 22) * 0.8 + (ages - 30) * 0.2
    diastolic = np.random.normal(80, 10, size=num_samples) + (bmis - 22) * 0.4 + (ages - 30) * 0.1

    systolic = np.clip(systolic, 70, 220)
    diastolic = np.clip(diastolic, 40, 130)

    # Label assignment: 1 for diabetic risk, 0 otherwise
    target = np.zeros(num_samples, dtype=int)
    for i in range(num_samples):
        if hba1c[i] >= 6.5 or fbs[i] >= 126:
            target[i] = 1
        elif bmis[i] >= 28.0 and hba1c[i] >= 5.7:
            target[i] = 1

    df = pd.DataFrame({
        "age": ages,
        "gender": genders,
        "heightCm": heights.round(1),
        "weightKg": weights.round(1),
        "bmi": bmis.round(2),
        "smoking": smokings,
        "exercise": exercises,
        "systolicBP": systolic.round(1),
        "diastolicBP": diastolic.round(1),
        "fastingBloodSugar": fbs.round(1),
        "bloodSugarHbA1c": hba1c.round(2),
        "target": target
    })

    # Save to ignored dataset directory
    os.makedirs("health-intelligence/data", exist_ok=True)
    df.to_csv("health-intelligence/data/diabetes_data.csv", index=False)
    print(f"Generated {num_samples} patient records and saved to health-intelligence/data/diabetes_data.csv")

if __name__ == "__main__":
    generate_data()
