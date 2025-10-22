import { addDoc, getDocs, collection, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  useEvaluations,
  EvaluationStatus,
} from "@/context/EvaluationContext";

const STATUS_LABELS: Record<EvaluationStatus, string> = {
  done: "できている",
  not_done: "できていない",
  not_applicable: "該当なし",
};

const STATUS_OPTIONS: { value: EvaluationStatus; label: string }[] = [
  { value: "done", label: STATUS_LABELS.done },
  { value: "not_done", label: STATUS_LABELS.not_done },
  { value: "not_applicable", label: STATUS_LABELS.not_applicable },
];

const formatDateTime = (isoString: string) =>
  new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(isoString));

const RecordPage = () => {
  const { addEntry, entries, evaluatorNames, removeEntry, updateEntry } =
    useEvaluations();

  const [mode, setMode] = useState<"input" | "select">(
    evaluatorNames.length > 0 ? "select" : "input"
  );
  const [evaluatorName, setEvaluatorName] = useState("");
  const [selectedEvaluator, setSelectedEvaluator] = useState<string>(
    evaluatorNames[0] ?? ""
  );
  const [statusAdpro, setStatusAdpro] =
    useState<EvaluationStatus>("done");
  const [statusVaseline, setStatusVaseline] =
    useState<EvaluationStatus>("done");
  const [note, setNote] = useState("");
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");

  // Firestoreからデータを読み込む
  useEffect(() => {
    const fetchData = async () => {
      try {
        const snapshot = await getDocs(collection(db, "records"));
        const records = snapshot.docs.map(doc => ({
          id: doc.id,
          firestoreId: doc.id,
          ...doc.data(),
        }));
        records.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        records.forEach(r => addEntry(r));
        console.log("Firestoreからデータ取得完了:", records.length);
      } catch (error) {
        console.error("Firestoreデータの読み込み失敗:", error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (evaluatorNames.length === 0) {
      setMode("input");
      setSelectedEvaluator("");
    } else if (mode === "select" && !selectedEvaluator) {
      setSelectedEvaluator(evaluatorNames[0]);
    }
  }, [evaluatorNames, mode, selectedEvaluator]);

  useEffect(() => {
    if (!alert) return;
    const timeout = window.setTimeout(() => setAlert(null), 2500);
    return () => window.clearTimeout(timeout);
  }, [alert]);

  const bmi = useMemo(() => {
    const height = Number(heightCm);
    const weight = Number(weightKg);

    if (!height || !weight) {
      return null;
    }

    const heightInMeters = height / 100;
    if (heightInMeters <= 0) {
      return null;
    }

    const value = weight / (heightInMeters * heightInMeters);
    if (!Number.isFinite(value)) {
      return null;
    }

    return Math.round(value * 10) / 10;
  }, [heightCm, weightKg]);

  const formattedBmi = bmi !== null ? bmi.toFixed(1) : "--";
  const isUnderweight = bmi !== null && bmi <= 18.5;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nameToUse =
      mode === "select"
        ? selectedEvaluator === "__custom"
          ? evaluatorName
          : selectedEvaluator
        : evaluatorName;

    if (!nameToUse.trim()) {
      setAlert({ type: "error", text: "評価者名を入力してください" });
      return;
    }

    setSubmitting(true);

    const createdAt = new Date();

    const localEntry = addEntry({
      createdAt: createdAt.toISOString(),
      evaluatorName: nameToUse,
      statusAdpro,
      statusVaseline,
      note,
    });

    try {
      const docRef = await addDoc(collection(db, "records"), {
        evaluatorName: nameToUse,
        statusAdpro,
        statusVaseline,
        note,
        createdAt,
      });

      updateEntry(localEntry.id, { firestoreId: docRef.id });

      setAlert({
        type: "success",
        text: "Firestoreにも保存しました！",
      });
    } catch (error) {
      console.error("Failed to add record to Firestore", error);
      setAlert({
        type: "error",
        text: "Firestoreへの保存に失敗しました（ローカルには保存済み）",
      });
    } finally {
      setSubmitting(false);
    }

    setEvaluatorName("");
    setNote("");

    if (mode === "select") {
      setSelectedEvaluator(nameToUse === "__custom" ? "" : nameToUse);
    }
  };

  const handleDelete = async (
    entryId: string,
    firestoreId?: string | null
  ) => {
    if (deletingId) return;

    setDeletingId(entryId);

    const documentId = firestoreId ?? entryId;

    try {
      await deleteDoc(doc(db, "records", documentId));
      removeEntry(entryId);
      setAlert({ type: "success", text: "記録を削除しました" });
    } catch (error) {
      console.error("Failed to delete record", error);
      setAlert({ type: "error", text: "削除に失敗しました" });
    } finally {
      setDeletingId(null);
    }
  };

  const recentEntries = useMemo(() => entries.slice(0, 5), [entries]);

  return (
    <div className="record-page">
      <section className="card">
        <h2>BMIチェック</h2>
        <div className="form">
          <div className="form-group">
            <label className="form-label" htmlFor="height">
              身長（cm）
            </label>
            <input
              id="height"
              className="input"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.1"
              placeholder="例：160"
              value={heightCm}
              onChange={(event) => setHeightCm(event.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="weight">
              体重（kg）
            </label>
            <input
              id="weight"
              className="input"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.1"
              placeholder="例：50"
              value={weightKg}
              onChange={(event) => setWeightKg(event.target.value)}
            />
          </div>
          <div className="form-group">
            <span className="form-label">BMI</span>
            <div className="bmi-result">
              <span className="bmi-value">{formattedBmi}</span>
              {isUnderweight && (
                <span className="text-danger">評価対象</span>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="card">
        <h2>評価フォーム</h2>
        <form className="form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="evaluator">
              評価者名
            </label>
            {mode === "select" && evaluatorNames.length > 0 ? (
              <select
                id="evaluator"
                className="input"
                value={selectedEvaluator}
                onChange={(event) =>
                  setSelectedEvaluator(event.target.value)
                }
              >
                {evaluatorNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
                <option value="__custom">新しく入力</option>
              </select>
            ) : (
              <input
                id="evaluator"
                className="input"
                type="text"
                placeholder="例：佐藤"
                value={evaluatorName}
                onChange={(event) =>
                  setEvaluatorName(event.target.value)
                }
              />
            )}
            {mode === "select" && selectedEvaluator === "__custom" && (
              <input
                className="input mt-8"
                type="text"
                placeholder="新しい評価者名"
                value={evaluatorName}
                onChange={(event) =>
                  setEvaluatorName(event.target.value)
                }
              />
            )}
            <div className="switcher">
              <button
                type="button"
                className={`text-button ${
                  mode === "input" ? "active" : ""
                }`}
                onClick={() => {
                  setMode("input");
                  setSelectedEvaluator(evaluatorNames[0] ?? "");
                }}
              >
                自由入力
              </button>
              <button
                type="button"
                className={`text-button ${
                  mode === "select" ? "active" : ""
                }`}
                onClick={() => {
                  setMode("select");
                  setSelectedEvaluator(
                    evaluatorNames[0] ?? "__custom"
                  );
                }}
                disabled={evaluatorNames.length === 0}
              >
                プルダウン
              </button>
            </div>
          </div>

          <fieldset className="form-group">
            <legend className="form-label">
              A. 骨突出／医療機器あり → アドプロテープ使用
            </legend>
            <div className="option-row">
              {STATUS_OPTIONS.map((option) => (
                <label key={option.value} className="chip">
                  <input
                    type="radio"
                    name="status-adpro"
                    value={option.value}
                    checked={statusAdpro === option.value}
                    onChange={() => setStatusAdpro(option.value)}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="form-group">
            <legend className="form-label">
              B. 失禁あり → ワセリン使用
            </legend>
            <div className="option-row">
              {STATUS_OPTIONS.map((option) => (
                <label key={option.value} className="chip">
                  <input
                    type="radio"
                    name="status-vaseline"
                    value={option.value}
                    checked={statusVaseline === option.value}
                    onChange={() =>
                      setStatusVaseline(option.value)
                    }
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="form-group">
            <label className="form-label" htmlFor="note">
              C. 自由記録（患者個人情報は入力しない）
            </label>
            <textarea
              id="note"
              className="textarea"
              placeholder="実施状況の補足や気づきを記録"
              rows={4}
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </div>

          <button
            type="submit"
            className="primary-button"
            disabled={submitting}
          >
            {submitting ? "保存中..." : "保存する"}
          </button>
          {alert && (
            <p className={`feedback ${alert.type}`}>
              {alert.text}
            </p>
          )}
        </form>
      </section>

      <section className="card">
        <h2>最新の記録</h2>
        {recentEntries.length === 0 ? (
          <p className="muted">まだ記録がありません。</p>
        ) : (
          <ul className="entry-list">
            {recentEntries.map((entry) => (
              <li key={entry.id} className="entry-item">
                <div className="entry-header">
                  <div className="entry-meta">
                    <span className="entry-evaluator">
                      {entry.evaluatorName}
                    </span>
                    <span className="entry-date">
                      {formatDateTime(entry.createdAt)}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="entry-delete-button"
                    onClick={() =>
                      handleDelete(entry.id, entry.firestoreId)
                    }
                    disabled={deletingId === entry.id}
                  >
                    {deletingId === entry.id ? "削除中..." : "削除"}
                  </button>
                </div>
                <div className="entry-status">
                  <span
                    className={`badge status-${entry.statusAdpro}`}
                  >
                    アドプロ：
                    {STATUS_LABELS[entry.statusAdpro]}
                  </span>
                  <span
                    className={`badge status-${entry.statusVaseline}`}
                  >
                    ワセリン：
                    {STATUS_LABELS[entry.statusVaseline]}
                  </span>
                </div>
                {entry.note && (
                  <p className="entry-note">{entry.note}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default RecordPage;
