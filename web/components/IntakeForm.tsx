"use client";
import { useMemo, useState } from "react";
import { BARANGAYS, type AreaConfig, type Vals } from "@/lib/core";

export default function IntakeForm({
  area,
  onSubmit,
}: {
  area: AreaConfig;
  onSubmit: (values: Vals) => void;
}) {
  const [values, setValues] = useState<Vals>({});
  const key = useMemo(() => area.id, [area.id]);
  const set = (k: string, v: string) => setValues((p) => ({ ...p, [k]: v }));

  const required = area.fields.filter((f) => f.type !== "photo");
  const complete = required.every((f) => (values[f.key] ?? "").toString().trim() !== "");

  const submit = () => {
    if (!complete) return;
    onSubmit(values);
    setValues({});
  };

  const isKilo = area.id === "waste";

  return (
    <div className={`panel panel-intake ${isKilo ? "panel-kilo" : ""}`} key={key}>
      {isKilo && (
        <div className="panel-stamp" aria-hidden>
          WEIGH-IN
        </div>
      )}
      <h2>{area.intakeTitle}</h2>
      <p className="hint">
        {isKilo
          ? "Para sa junkshop: ilagay ang load, tignan ang fair price board, i-save ang buy."
          : "Fill in what a real Tagum user would know, then get a practical answer."}
      </p>

      {area.fields.map((f) => (
        <div className="field" key={f.key}>
          <label htmlFor={f.key}>{f.label}</label>

          {f.type === "select" && (
            <select
              id={f.key}
              value={values[f.key] ?? ""}
              onChange={(e) => set(f.key, e.target.value)}
            >
              <option value="">Select…</option>
              {f.options?.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          )}

          {f.type === "location" && (
            <select
              id={f.key}
              value={values[f.key] ?? ""}
              onChange={(e) => set(f.key, e.target.value)}
            >
              <option value="">Select barangay…</option>
              {BARANGAYS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          )}

          {(f.type === "text" || f.type === "number") && (
            <div className="unit">
              <input
                id={f.key}
                type={f.type === "number" ? "number" : "text"}
                inputMode={f.type === "number" ? "decimal" : undefined}
                step={f.type === "number" ? "any" : undefined}
                placeholder={f.placeholder}
                value={values[f.key] ?? ""}
                onChange={(e) => set(f.key, e.target.value)}
              />
              {f.unit && <span>{f.unit}</span>}
            </div>
          )}

          {f.type === "photo" && (
            <PhotoField value={values[f.key]} onChange={(d) => set(f.key, d)} />
          )}
        </div>
      ))}

      <button className="btn" onClick={submit} disabled={!complete}>
        {complete
          ? isKilo
            ? "Check fair price & save buy"
            : "Get answer & save"
          : "Fill required fields"}
      </button>
    </div>
  );
}

function PhotoField({
  value,
  onChange,
}: {
  value?: string;
  onChange: (dataUrl: string) => void;
}) {
  return (
    <label className="photo-drop" style={{ display: "block", cursor: "pointer" }}>
      {value ? <img src={value} alt="uploaded preview" /> : "Tap to add a photo (optional)"}
      <input
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => onChange(String(reader.result));
          reader.readAsDataURL(file);
        }}
      />
    </label>
  );
}
