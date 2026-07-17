import { type UserProfile, type CompleteRiskAnalysis } from "../services/risk.service.js";

export interface HeuristicRiskResult {
  riskCategory: "low" | "moderate" | "high";
  confidence: number;
  supportingFactors: string[];
  version: "heuristic-v1";
  explanation: string;
}

export class ExperimentalRiskHeuristicService {
  /**
   * Classify user risk using an experimental deterministic weighted heuristic classifier.
   * Supports existing clinical scoring and provides explainable insights.
   */
  static classifyRisk(
    profile: UserProfile,
    clinicalRiskResult: CompleteRiskAnalysis,
  ): HeuristicRiskResult {
    let score = 0;
    const factors: string[] = [];
    const lang = profile.language || "en";

    // 1. BMI calculation
    const heightM = profile.heightCm / 100;
    const bmi = profile.weightKg / (heightM * heightM);

    if (bmi >= 25) {
      score += 15;
      if (lang === "hi") {
        factors.push("उच्च बीएमआई (अधिक वजन या मोटापा)");
      } else if (lang === "gu") {
        factors.push("ઉચ્ચ BMI (વધુ વજન અથવા સ્થૂળતા)");
      } else {
        factors.push(`High BMI (${bmi.toFixed(1)})`);
      }
    }

    // 2. sedentary lifestyle
    const isSedentary = profile.exercise === "none" || (profile as any).exerciseLevel === "none";
    if (isSedentary) {
      score += 15;
      if (lang === "hi") {
        factors.push("गतिहीन जीवन शैली (कोई व्यायाम दर्ज नहीं)");
      } else if (lang === "gu") {
        factors.push("બેઠાડુ જીવનશૈલી (કોઈ કસરત નોંધayેલ નથી)");
      } else {
        factors.push("Sedentary lifestyle");
      }
    }

    // 3. age over 45
    if (profile.age > 45) {
      score += 10;
      if (lang === "hi") {
        factors.push(`45 वर्ष से अधिक आयु (${profile.age} वर्ष)`);
      } else if (lang === "gu") {
        factors.push(`45 વર્ષથી વધુ ઉંમર (${profile.age} વર્ષ)`);
      } else {
        factors.push(`Age over 45 years (${profile.age})`);
      }
    }

    // 4. smoking
    if (profile.smoking === "current") {
      score += 12;
      if (lang === "hi") {
        factors.push("सक्रिय धूम्रपान की स्थिति");
      } else if (lang === "gu") {
        factors.push("સક્રિય ધૂમ્રપાનની સ્થિતિ");
      } else {
        factors.push("Active smoking status");
      }
    }

    // 5. frequent alcohol
    const alcVal = (profile.alcohol || "").toLowerCase();
    if (alcVal.includes("frequent") || alcVal.includes("heavy")) {
      score += 8;
      if (lang === "hi") {
        factors.push("बार-बार या भारी शराब का सेवन");
      } else if (lang === "gu") {
        factors.push("વારંવાર અથવા ભારે દારૂનો વપરાશ");
      } else {
        factors.push("Frequent or heavy alcohol consumption");
      }
    }

    // 6. family history
    const fhLower = (profile.familyHistory || "").toLowerCase();
    if (
      fhLower.trim().length > 0 &&
      !fhLower.includes("none") &&
      !fhLower.includes("no family history") &&
      !fhLower.includes("no ")
    ) {
      score += 10;
      if (lang === "hi") {
        factors.push("क्रोनिक बीमारियों का पारिवारिक इतिहास");
      } else if (lang === "gu") {
        factors.push("ક્રોનિક રોગોનો પારિવારિક ઇતિહાસ");
      } else {
        factors.push("Family history of chronic diseases");
      }
    }

    // 7. active symptoms
    const sxLower = (profile.symptoms || "").toLowerCase();
    if (
      sxLower.trim().length > 0 &&
      !sxLower.includes("none") &&
      !sxLower.includes("no symptoms")
    ) {
      score += 8;
      if (lang === "hi") {
        factors.push("सक्रिय लक्षणों की उपस्थिति");
      } else if (lang === "gu") {
        factors.push("સક્રિય લક્ષણોની હાજરી");
      } else {
        factors.push("Presence of active symptoms");
      }
    }

    // 8. high clinical overall risk
    const isHighClinicalOverall =
      clinicalRiskResult.overallRisk >= 60 || clinicalRiskResult.overallRiskLabel === "High";

    if (isHighClinicalOverall) {
      score += 20;
      if (lang === "hi") {
        factors.push("बढ़ा हुआ समग्र नैदानिक जोखिम");
      } else if (lang === "gu") {
        factors.push("એલિવેટેડ ક્લિનિકલ જોખમ");
      } else {
        factors.push("Elevated clinical overall risk");
      }
    }

    // 9. high clinical diabetes/heart/hypertension risk
    if (clinicalRiskResult.diabetesRisk.level === "High") {
      score += 10;
      if (lang === "hi") {
        factors.push("उच्च नैदानिक मधुमेह जोखिम");
      } else if (lang === "gu") {
        factors.push("ઉચ્ચ ક્લિનિકલ ડાયાબિટીસ જોખમ");
      } else {
        factors.push("High clinical diabetes risk");
      }
    }
    if (clinicalRiskResult.heartRisk.level === "High") {
      score += 10;
      if (lang === "hi") {
        factors.push("उच्च नैदानिक हृदय रोग जोखिम");
      } else if (lang === "gu") {
        factors.push("ઉચ્ચ ક્લિનિકલ હૃદય રોગ જોખમ");
      } else {
        factors.push("High clinical heart disease risk");
      }
    }
    if (clinicalRiskResult.hypertensionRisk.level === "High") {
      score += 10;
      if (lang === "hi") {
        factors.push("उच्च नैदानिक उच्च रक्तचाप जोखिम");
      } else if (lang === "gu") {
        factors.push("ઉચ્ચ ક્લિનિકલ હાયપરટેન્શન જોખમ");
      } else {
        factors.push("High clinical hypertension risk");
      }
    }

    // Fallback if factors list is empty
    if (factors.length === 0) {
      if (lang === "hi") {
        factors.push("सामान्य सीमाओं के भीतर बुनियादी पैरामीटर");
      } else if (lang === "gu") {
        factors.push("સામાન્ય મર્યાદામાં મૂળભૂત પરિમાણો");
      } else {
        factors.push("Baseline parameters within normal limits");
      }
    }

    // Classify
    let riskCategory: "low" | "moderate" | "high" = "low";
    if (score >= 65) {
      riskCategory = "high";
    } else if (score >= 35) {
      riskCategory = "moderate";
    }

    // Determine confidence
    let confidence = 85;

    // Completeness check
    const checkFields = [
      profile.age,
      profile.gender,
      profile.heightCm,
      profile.weightKg,
      profile.smoking,
      profile.exercise,
      profile.familyHistory,
      profile.symptoms,
      profile.alcohol,
    ];

    checkFields.forEach((field) => {
      if (field === undefined || field === null || String(field).trim() === "") {
        confidence -= 3;
      }
    });

    // Clinical agreement check
    const clinicalLabel = (clinicalRiskResult.overallRiskLabel || "Low").toLowerCase();
    if (riskCategory === clinicalLabel) {
      confidence += 10;
    } else if (
      (riskCategory === "low" && clinicalLabel === "high") ||
      (riskCategory === "high" && clinicalLabel === "low")
    ) {
      confidence -= 20;
    } else {
      confidence -= 5;
    }

    // Clamp confidence between 50 and 98
    confidence = Math.max(50, Math.min(98, confidence));

    // Localize explanation
    let explanation = "";
    if (riskCategory === "low") {
      if (lang === "hi") {
        explanation =
          "आपकी प्रोफ़ाइल इष्टतम सीमाओं के भीतर मेट्रिक्स के साथ कम जोखिम स्तर का सुझाव देती है। अपनी सक्रिय और संतुलित दिनचर्या बनाए रखना जारी रखें।";
      } else if (lang === "gu") {
        explanation =
          "તમારી પ્રોફાઇલ શ્રેષ્ઠ શ્રેણીમાં મેટ્રિક્સ સાથે નીચા જોખમ સ્તરનું સૂચન કરે છે. તમારી સક્રિય અને સંતુલિત દિનચર્યા જાળવી રાખવાનું ચાલુ રાખો.";
      } else {
        explanation =
          "Your profile suggests a low risk level with metrics within optimal ranges. Continue maintaining your active and balanced routine.";
      }
    } else if (riskCategory === "moderate") {
      if (lang === "hi") {
        explanation =
          "आपकी जीवनशैली या बायोमेट्रिक कारकों में कुछ बढ़े हुए संकेतक पाए गए हैं। हम नियमित शारीरिक गतिविधि और संतुलित आहार को शामिल करने की सलाह देते हैं।";
      } else if (lang === "gu") {
        explanation =
          "તમારી જીવનશૈલી અથવા બાયોમેટ્રિક પરિબળોમાં કેટલાક એલિવેટેડ સૂચકાંકો જોવા મળ્યા છે. અમે નિયમિત શારીરિક પ્રવૃત્તિ અને સંતુલિત આહારનો સમાવેશ કરવાની ભલામણ કરીએ છીએ.";
      } else {
        explanation =
          "Some elevated indicators were detected in your lifestyle or biometric factors. We recommend incorporating regular physical activity and a balanced diet.";
      }
    } else {
      if (lang === "hi") {
        explanation =
          "आपके नैदानिक स्कोर और जीवनशैली मेट्रिक्स में कई उच्च जोखिम वाले संकेतक पाए गए हैं। हम व्यक्तिगत नैदानिक समीक्षा के लिए स्वास्थ्य पेशेवर से परामर्श करने की दृढ़ सलाह देते हैं।";
      } else if (lang === "gu") {
        explanation =
          "તમારો ક્લિનિકલ સ્કોર અને જીવનશૈલી મેટ્રિક્સમાં બહુવિધ ઉચ્ચ-જોખમ સૂચકાંકો જોવા મળ્યા છે. અમે વ્યક્તિગત નિદાન સમીક્ષા માટે આરોગ્ય વ્યાવસાયિકની સલાહ લેવાની ભારપૂર્વક ભલામણ કરીએ છીએ.";
      } else {
        explanation =
          "Multiple high-risk indicators were detected in your clinical score and lifestyle metrics. We strongly advise consulting a healthcare professional for a personalized diagnostic review.";
      }
    }

    return {
      riskCategory,
      confidence,
      supportingFactors: factors.slice(0, 3),
      version: "heuristic-v1",
      explanation,
    };
  }
}
