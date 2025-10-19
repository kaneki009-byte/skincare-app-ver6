# Skin Care Tracker

病棟看護師5名で利用するスキンケア記録アプリ（PWA対応）。BMI 18.5 以下または浮腫のある患者に対するアドプロテープ・ワセリン使用状況を記録し、月単位で集計・可視化します。

## 主な機能
- 評価フォーム
  - 評価者名は初回自由入力、2回目以降はプルダウン選択（新規追加も可能）
  - アドプロテープ／ワセリンの実施状況を「できている／できていない／該当なし」で記録
  - 自由記録欄（患者個人情報は入力不可）
- ローカル保存
  - ブラウザの `localStorage` に保存（Firestore 連携を想定した構成）
- ダッシュボード
  - 月ごとの件数・実施状況をサマリーカード、円グラフ、棒グラフ、表で表示（Recharts 使用）
- PWA 対応
  - `manifest.webmanifest` と `service-worker.js` によるキャッシュファースト戦略
  - iPhone などでホーム画面に追加可能

## 開発環境
- React 18 + TypeScript
- Vite 5
- Recharts
- ESLint（TypeScript / React Hooks）

## セットアップ
```bash
npm install
npm run dev
```

### ビルド
```bash
npm run build
npm run preview
```

## Firebase 連携の拡張ポイント
- `src/context/EvaluationContext.tsx` 内の `addEntry` を Firestore 書き込み処理に差し替える想定です。
- Firebase 初期化用のモジュールを `src/lib/firebase.ts` などに追加し、`app`, `db` を提供してください。
- Firestore ではオフライン永続化を有効にし、匿名認証（`signInAnonymously`）を利用する計画です。

## PWA 開発メモ
- `public/service-worker.js` でキャッシュファースト戦略を実装しています。キャッシュバージョンを変更する場合は `CACHE_NAME` を更新してください。
- アイコンは `public/assets/icons` に配置済みです。必要に応じて病棟向けのデザインに差し替えてください。

## ディレクトリ構成（抜粋）
```
.
├── public
│   ├── assets/icons/icon-192.png
│   ├── assets/icons/icon-512.png
│   ├── manifest.webmanifest
│   └── service-worker.js
├── src
│   ├── App.tsx
│   ├── context/EvaluationContext.tsx
│   ├── hooks/useLocalStorage.ts
│   ├── pages/DashboardPage.tsx
│   ├── pages/RecordPage.tsx
│   ├── styles/global.css
│   └── main.tsx
├── index.html
├── package.json
└── vite.config.ts
```

## ライセンス
院内利用を想定。外部配布時は病院ポリシーに従ってください。
