"use client";
import React, { useEffect } from "react";

export default function AutoAnalyze() {
  useEffect(() => {
    const triggerOnce = () => {
      let tries = 0;
      const id = setInterval(() => {
        tries++;
        const btns = Array.from(document.querySelectorAll("button"));
        const analyzeBtn = btns.find(
          (b) => (b.textContent || "").trim().toLowerCase() === "analyze"
        ) as HTMLButtonElement | undefined;
        if (analyzeBtn) {
          analyzeBtn.click();
          clearInterval(id);
        } else if (tries > 50) {
          clearInterval(id);
        }
      }, 100);
    };

    const onFileChange = () => setTimeout(triggerOnce, 150);

    const hookInputs = () => {
      const inputs = Array.from(document.querySelectorAll('input[type="file"]'));
      inputs.forEach((inp) => {
        inp.removeEventListener("change", onFileChange);
        inp.addEventListener("change", onFileChange, { passive: true });
      });
    };

    hookInputs();
    const rehookId = setInterval(hookInputs, 1000);
    setTimeout(() => clearInterval(rehookId), 8000);

    return () => {
      const inputs = Array.from(document.querySelectorAll('input[type="file"]'));
      inputs.forEach((inp) => inp.removeEventListener("change", onFileChange));
    };
  }, []);

  return null;
}
