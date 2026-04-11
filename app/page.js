"use client";
import { useState, useEffect, useRef } from "react";

const GAS_URL = process.env.NEXT_PUBLIC_GAS_URL || "";

async function gasPost(body) {
  if (!GAS_URL) throw new Error("GAS URLが未設定です（NEXT_PUBLIC_GAS_URL）");
  const res = await fetch(GAS_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("通信エラー: " + res.status);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || "処理に失敗しました");
  return data;
}

// ─── 品目別 画像査定チェックポイント ────────────────────────────────
// AIプロンプトに渡す「この画像のどこを見るべきか」の指示
const IMAGE_CHECK_POINTS = {
  brand_bag: `【画像査定チェックポイント：ブランドバッグ】
・正面全体：シルエットの歪み・型崩れ・キャンバスの汚れ・色褪せを確認
・底面・角：スレ・擦れ・革のはがれ・コーティング剥離の程度を確認
・持ち手・ストラップ：黒ずみ・ひび割れ・ステッチのほつれを確認
・金具：錆び・くすみ・刻印の鮮明さ・メッキ剥がれを確認
・内部・シリアルタグ：シリアル番号の書体・フォント・印字の鮮明さを確認
・縫製：ステッチの均一性・糸の色・縫い目の傾きを確認
・ロゴ・刻印：にじみ・ズレ・太さの不均一がないか確認
→真贋疑義がある場合はその根拠を明記すること`,

  brand_watch: `【画像査定チェックポイント：腕時計】
・文字盤：傷・にじみ・インデックスの欠け・日付窓の状態を確認
・ケース側面：ポリッシュとヘアラインの境界・傷の深さ・研磨跡を確認
・裏蓋：シリアル番号の書体・深さ・防水性能の刻印を確認
・ブレスレット：コマの伸び・傷・クラスプの状態・コマ数を確認
・リューズ：傷・欠け・ネジ込みの状態を確認
・ガラス：傷の深さ・コーティングの剥がれ・反射の歪みを確認
→研磨跡がある場合は大幅減額要因として必ず言及すること`,

  jewelry: `【画像査定チェックポイント：ジュエリー・宝石】
・地金全体：変色・傷・歪み・溶接跡・刻印の鮮明さを確認
・宝石：透明感・内包物・欠け・ひび・カット面の均一性を確認
・爪・留め具：石の緩み・爪の曲がり・欠けを確認
・刻印：K18・Pt900等の刻印が明確かつ正規品と一致するか確認
・全体のプロポーション：バランス・歪みがないか確認
→鑑定書の画像がある場合は石のサイズ・品質と目視で矛盾がないか確認`,

  brand_clothes: `【画像査定チェックポイント：ブランド衣類】
・生地全体：毛羽立ち・ピリング・シミ・色褪せ・変色を確認
・ブランドタグ：書体・縫い付けの丁寧さ・素材表示の整合性を確認
・縫製：ステッチの均一性・糸のほつれ・縫い目の傾きを確認
・ボタン・ジッパー：ブランド刻印・動作・欠け・変色を確認
・袖口・襟・裾：擦れ・ほつれ・型崩れの程度を確認
・ケアラベル：素材表示・原産国の印字鮮明さを確認
→ブランドタグと実物の整合性に疑義がある場合は明記すること`,

  electronics: `【画像査定チェックポイント：家電・電子機器】
・画面（点灯状態）：輝度ムラ・焼き付き・ドット欠け・傷・タッチ反応を確認
・背面・側面：傷の深さ・凹み・曲がり・塗装剥がれを確認
・充電口・端子：腐食・曲がり・ゴミ詰まりを確認
・カメラレンズ：傷・くもり・異物混入を確認
・バッテリー膨らみ：背面の膨らみ・変形がないか確認
・シリアル表示画面：IMEI・シリアルと外箱の一致を確認
→水没マーク（白/赤の小さなシール）が見える場合は大幅減額要因として必ず言及`,

  antique: `【画像査定チェックポイント：骨董品・美術品】
・全体：プロポーション・釉薬のかかり方・焼成の状態を確認
・銘・落款：位置・書体・深さ・既知の作品との整合性を確認
・底面：高台の形状・釉薬のはがれ・窯印・サイン・補修跡を確認
・ひび・欠け：金継ぎ・補修の有無・範囲・色の差異を確認
・共箱・仕覆：箱書きの筆跡・墨の状態・作品との整合性を確認
・経年変化：自然な古色か・人工的な着色の疑いがないかを確認
→真贋の判断が画像のみでは困難な場合はその旨を明記し「持ち帰り鑑定推奨」と記載`,

  musical: `【画像査定チェックポイント：楽器】
・ヘッド・ヘッドストック：シリアル・ブランドロゴ・ペグの状態を確認
・ネック：反り（正面から目視）・フレットの減り・塗装の剥がれを確認
・ボディ：打痕・クラック・塗装剥がれ・リフィニッシュ跡を確認
・フレット：磨耗の程度・錆び・段差を確認
・ブリッジ・ナット：素材・浮き・加工跡を確認
・電装系（エレキ）：ジャック・スイッチ・ポットの腐食・改造痕を確認
→リフィニッシュ（再塗装）や大規模修理跡がある場合は大幅減額要因として必ず言及`,

  liquor: `【画像査定チェックポイント：お酒】
・ラベル：印刷の鮮明さ・にじみ・破れ・シミ・糊跡を確認
・液面レベル：肩口・首部分からの距離で減りを確認
・キャップ・コルク：開封痕・割れ・錆び・液漏れ跡を確認
・ボトル全体：傷・欠け・変色・封蝋の状態を確認
・背面ラベル：輸入者表示・バーコード・偽造疑いがないかを確認
・箱：折れ・シミ・色褪せの程度を確認
→液面が著しく少ない場合や開封済みが疑われる場合は価格への影響を明記`,

  gold_metal: `【画像査定チェックポイント：金・貴金属】
・表面全体：傷・変色・メッキの剥がれ・均一な色調かを確認
・刻印：K18・K24・Pt900等の刻印が深く鮮明かを確認
・製造元マーク：田中貴金属・三菱マテリアル等のホールマーク・シリアルを確認
・鑑定書：カラット・重量・発行機関の整合性を確認
・形状・重量感：画像から視認できる変形・欠け・接合部の不自然さを確認
→表面が均一すぎる（メッキの可能性）・刻印が浅い場合は真贋疑義として必ず言及`,

  other: `【画像査定チェックポイント：その他】
・全体：傷・欠け・変色・汚れの程度と範囲を確認
・ブランドロゴ・刻印：鮮明さ・正規品との整合性を確認
・素材感：経年劣化・変質・補修跡を確認
・付属品・箱：状態・整合性・オリジナル品かを確認`,
};

const CATEGORY_CONFIG = {
  brand_bag: {
    label: "ブランドバッグ", examples: "ルイヴィトン, シャネル, エルメス", needsAuth: true,
    fields: [
      { key: "brand", label: "ブランド", placeholder: "例: ルイヴィトン", required: true },
      { key: "name", label: "商品名 / 型番", placeholder: "例: ネヴァーフル MM M40995", required: true },
      { key: "material", label: "素材", placeholder: "例: モノグラム・キャンバス" },
      { key: "color", label: "カラー", placeholder: "例: ブラウン" },
      { key: "serial", label: "シリアル / 製造番号", placeholder: "内部タグに記載" },
      { key: "accessories", label: "付属品", placeholder: "箱, 保存袋, ストラップ" },
      { key: "condition_detail", label: "状態の詳細", placeholder: "角スレ、持ち手の黒ずみなど", multiline: true },
    ],
    photoGuide: [
      "①正面全体（型崩れ・汚れ）",
      "②背面全体",
      "③底面アップ（角スレ確認）",
      "④持ち手・ストラップ（黒ずみ・ひび）",
      "⑤金具アップ（刻印・錆び）",
      "⑥内部シリアルタグ（番号全体）",
      "⑦ロゴ・刻印アップ",
      "⑧ダメージ箇所（あれば）",
    ],
    authGuide: { summary: "「素材の質感」「縫製の精度」「金具の刻印」の3点を重点確認。手触りと匂いは現場でしか確認できない重要な判断材料です。", checks: ["素材の質感と匂い — 本革特有のしっとり感。合皮はビニール臭","縫製 — 糸の間隔が均一か。斜めに傾いていたら要注意","金具の刻印 — ブランド名の彫りが浅い・にじむものは偽物の可能性","シリアル — 書体やフォーマットが正規品と一致するか","ロゴ印字 — にじみ・ズレ・太さの不均一がないか"] },
  },
  brand_watch: {
    label: "腕時計", examples: "ロレックス, オメガ, カルティエ", needsAuth: true,
    fields: [
      { key: "brand", label: "ブランド", placeholder: "例: ロレックス", required: true },
      { key: "name", label: "モデル名 / Ref番号", placeholder: "例: デイトナ Ref.116500LN", required: true },
      { key: "movement", label: "ムーブメント", placeholder: "自動巻き / クォーツ" },
      { key: "case_material", label: "ケース素材", placeholder: "例: SS、18KYG" },
      { key: "serial", label: "シリアル", placeholder: "ケース裏/ラグ間" },
      { key: "accuracy", label: "精度・動作", placeholder: "例: 日差+3秒" },
      { key: "accessories", label: "付属品", placeholder: "箱, 保証書, コマ" },
      { key: "condition_detail", label: "状態の詳細", placeholder: "ガラス傷、ブレスのヨレなど", multiline: true },
    ],
    photoGuide: [
      "①文字盤正面（傷・日付窓）",
      "②ケース側面12時方向",
      "③ケース側面6時方向",
      "④裏蓋全体（シリアル番号）",
      "⑤ブレスレット全体（コマの状態）",
      "⑥バックル・クラスプ（刻印・状態）",
      "⑦リューズアップ",
      "⑧ダメージ・研磨跡（あれば）",
    ],
    authGuide: { summary: "「重量感」「リューズの操作感」「秒針の動き」を確認。本物はずっしり重い。研磨跡があると価値が大幅に下がります。", checks: ["重量感 — 偽物は明らかに軽い","秒針 — 機械式はスイープ運針。カチカチはクォーツか偽物","リューズ — 滑らかな抵抗感があるか","文字盤印刷 — ルーペで確認。にじみがないか","仕上げ — ヘアラインとポリッシュの境目が明確か","研磨跡 — ラグ・ケースの角が丸くなっていたら研磨済みで大幅減額"] },
  },
  jewelry: {
    label: "ジュエリー・宝石", examples: "ダイヤ, 金, プラチナ", needsAuth: true,
    fields: [
      { key: "brand", label: "ブランド（あれば）", placeholder: "ティファニー / ノーブランド" },
      { key: "name", label: "種類", placeholder: "例: ダイヤモンドリング", required: true },
      { key: "metal", label: "地金 / 刻印", placeholder: "例: Pt900, K18" },
      { key: "stone_type", label: "宝石の種類", placeholder: "例: ダイヤモンド" },
      { key: "stone_size", label: "カラット数", placeholder: "例: 0.5ct" },
      { key: "cert", label: "鑑定書", placeholder: "GIA等 / なし" },
      { key: "weight", label: "総重量", placeholder: "例: 5.2g" },
      { key: "accessories", label: "付属品", placeholder: "ケース, 鑑定書" },
      { key: "condition_detail", label: "状態の詳細", placeholder: "石のゆるみ、変色など", multiline: true },
    ],
    photoGuide: [
      "①全体正面（自然光で）",
      "②宝石アップ（透明感・輝き）",
      "③刻印アップ（K18・Pt900等）",
      "④爪・留め具アップ（石の固定状態）",
      "⑤裏側全体",
      "⑥鑑定書全体（あれば）",
      "⑦ダメージ箇所（あれば）",
    ],
    authGuide: { summary: "「刻印」「磁石テスト」「ルーペで石の確認」が基本。磁石とルーペは必携。", checks: ["刻印 — K18,Pt900等がはっきりしているか","磁石テスト — 金・プラチナは磁石に反応しない","ルーペで石 — 天然ダイヤは内包物あり。完全透明はCZの可能性","鑑定書照合 — カラット等が一致するか","地金色味 — K18は濃い金色、プラチナは白銀色"] },
  },
  brand_clothes: {
    label: "ブランド衣類", examples: "グッチ, プラダ, バーバリー", needsAuth: true,
    fields: [
      { key: "brand", label: "ブランド", placeholder: "例: グッチ", required: true },
      { key: "name", label: "アイテム名", placeholder: "例: GGマーモント ジャケット", required: true },
      { key: "size", label: "サイズ", placeholder: "例: 48, M" },
      { key: "color", label: "カラー", placeholder: "例: ブラック" },
      { key: "accessories", label: "付属品", placeholder: "タグ, ガーメントバッグ" },
      { key: "condition_detail", label: "状態の詳細", placeholder: "毛羽立ち、シミなど", multiline: true },
    ],
    photoGuide: [
      "①正面全体（自然光・ハンガー使用）",
      "②背面全体",
      "③ブランドタグアップ（書体・縫い付け）",
      "④ケアラベルアップ（素材・原産国）",
      "⑤袖口・襟・裾（擦れ・ほつれ）",
      "⑥ボタン・ジッパーアップ（刻印）",
      "⑦シミ・毛羽立ちなどダメージ箇所",
    ],
    authGuide: { summary: "「タグの品質」「縫製」「素材の質感」を確認。", checks: ["ブランドタグ — 書体・縫い付けが丁寧か","ケアラベル — 印字がクリアか","縫製 — ステッチ均一か","素材 — 表示と手触りが一致するか","ボタン・ジッパー — ブランド刻印と滑らかさ"] },
  },
  electronics: {
    label: "家電・電子機器", examples: "iPhone, カメラ, PC",
    fields: [
      { key: "brand", label: "メーカー", placeholder: "例: Apple", required: true },
      { key: "name", label: "商品名 / 型番", placeholder: "例: iPhone 15 Pro 256GB", required: true },
      { key: "serial", label: "シリアル / IMEI", placeholder: "設定画面で確認" },
      { key: "battery", label: "バッテリー", placeholder: "例: 最大容量89%" },
      { key: "operation", label: "動作状況", placeholder: "例: 問題なし" },
      { key: "lock", label: "ロック解除", placeholder: "iCloudサインアウト済等" },
      { key: "accessories", label: "付属品", placeholder: "箱, 充電器" },
      { key: "condition_detail", label: "状態の詳細", placeholder: "画面の傷など", multiline: true },
    ],
    photoGuide: [
      "①正面・画面（点灯状態で輝度ムラ確認）",
      "②背面（傷・カメラレンズ）",
      "③側面全周（凹み・ボタン状態）",
      "④充電口アップ（腐食・曲がり）",
      "⑤シリアル・IMEI表示画面",
      "⑥バッテリー情報画面（最大容量）",
      "⑦傷・ダメージ箇所アップ",
      "⑧付属品一式",
    ],
  },
  antique: {
    label: "骨董品・美術品", examples: "掛軸, 茶道具, 陶磁器", needsAuth: true,
    fields: [
      { key: "name", label: "品名", placeholder: "例: 備前焼 花入", required: true },
      { key: "artist", label: "作家名", placeholder: "例: 金重陶陽" },
      { key: "era", label: "時代", placeholder: "例: 江戸時代" },
      { key: "cert", label: "鑑定書 / 箱書", placeholder: "共箱あり / なし" },
      { key: "accessories", label: "付属品", placeholder: "共箱, 仕覆" },
      { key: "condition_detail", label: "状態の詳細", placeholder: "ヒビ、欠けなど", multiline: true },
    ],
    photoGuide: [
      "①全体正面（自然光）",
      "②全体側面",
      "③底面・高台アップ（窯印・銘）",
      "④銘・落款アップ",
      "⑤共箱・仕覆（箱書きが見える角度）",
      "⑥ひび・欠け・補修箇所アップ",
      "⑦鑑定書全体（あれば）",
    ],
    authGuide: { summary: "「銘の確認」「経年変化の自然さ」「共箱との一致」を確認。難しければ持ち帰り鑑定を提案。", checks: ["銘・落款 — 既知の作風と一致するか","経年変化 — 自然な古色か","共箱 — 箱書きと作品が矛盾しないか","技法 — 時代に合っているか"] },
  },
  musical: {
    label: "楽器", examples: "ギター, ピアノ, バイオリン",
    fields: [
      { key: "brand", label: "メーカー", placeholder: "例: Gibson", required: true },
      { key: "name", label: "モデル名", placeholder: "例: Les Paul Standard", required: true },
      { key: "year", label: "製造年", placeholder: "例: 2019年" },
      { key: "serial", label: "シリアル", placeholder: "ヘッド裏" },
      { key: "operation", label: "動作状況", placeholder: "ネック反り等" },
      { key: "accessories", label: "付属品", placeholder: "ケース" },
      { key: "condition_detail", label: "状態の詳細", placeholder: "打痕など", multiline: true },
    ],
    photoGuide: [
      "①正面全体（ボディ・ネック）",
      "②背面全体",
      "③ヘッド正面（ロゴ・ペグ）",
      "④ヘッド裏（シリアル番号）",
      "⑤ネック横から（反りの確認）",
      "⑥フレットアップ（減り・錆び）",
      "⑦ボディ打痕・塗装剥がれ箇所",
      "⑧ブリッジ・ジャック・電装系",
    ],
  },
  liquor: {
    label: "お酒", examples: "ウイスキー, ワイン, 日本酒",
    fields: [
      { key: "brand", label: "銘柄", placeholder: "例: 山崎25年", required: true },
      { key: "name", label: "種類", placeholder: "例: シングルモルト", required: true },
      { key: "volume", label: "容量", placeholder: "例: 700ml" },
      { key: "level", label: "液面レベル", placeholder: "減りなし / あり" },
      { key: "accessories", label: "付属品", placeholder: "箱" },
      { key: "condition_detail", label: "状態の詳細", placeholder: "ラベル状態など", multiline: true },
    ],
    photoGuide: [
      "①ボトル正面全体（ラベル全体）",
      "②液面レベル（肩口・首部分）",
      "③キャップ・封蝋アップ（開封痕）",
      "④前面ラベルアップ（印刷・状態）",
      "⑤背面ラベルアップ（輸入者・バーコード）",
      "⑥箱全体（あれば）",
    ],
  },
  gold_metal: {
    label: "金・貴金属", examples: "金地金, 金貨, プラチナ", needsAuth: true,
    fields: [
      { key: "name", label: "品名", placeholder: "例: 金地金 100g", required: true },
      { key: "metal_type", label: "種類 / 純度", placeholder: "例: K24純金" },
      { key: "weight", label: "重量", placeholder: "例: 100g", required: true },
      { key: "maker", label: "製造元", placeholder: "例: 田中貴金属" },
      { key: "cert", label: "鑑定書", placeholder: "あり / なし" },
      { key: "accessories", label: "付属品", placeholder: "ケース, 保証書" },
      { key: "condition_detail", label: "状態の詳細", placeholder: "傷、変色など", multiline: true },
    ],
    photoGuide: [
      "①表面全体（色調・均一性）",
      "②裏面全体",
      "③刻印アップ（純度・重量・製造元）",
      "④製造元ホールマークアップ",
      "⑤鑑定書全体（あれば）",
      "⑥傷・変色箇所アップ（あれば）",
    ],
    authGuide: { summary: "「磁石テスト」「重量実測」「刻印確認」が必須。精密はかりと磁石は必携。", checks: ["磁石テスト — 純金・プラチナは反応しない","重量実測 — 刻印と一致するか","刻印 — 深くシャープか","色味 — 純金は深い黄金色。メッキは均一すぎる","製造元照合 — シリアル確認可能なら照合"] },
  },
  other: {
    label: "その他", examples: "フィギュア, 食器 等",
    fields: [
      { key: "brand", label: "ブランド", placeholder: "例: バカラ" },
      { key: "name", label: "商品名", placeholder: "例: ロックグラス", required: true },
      { key: "accessories", label: "付属品", placeholder: "箱, 説明書" },
      { key: "condition_detail", label: "状態の詳細", placeholder: "傷、欠けなど", multiline: true },
    ],
    photoGuide: [
      "①全体正面",
      "②全体背面・底面",
      "③ロゴ・刻印アップ",
      "④傷・欠け・ダメージ箇所",
      "⑤箱・付属品（あれば）",
    ],
  },
};

const CONDITIONS = [
  { id: "S", label: "S 新品同様", desc: "未使用" },
  { id: "A", label: "A 美品", desc: "使用感ほぼなし" },
  { id: "B", label: "B 良好", desc: "多少の使用感" },
  { id: "C", label: "C やや難", desc: "傷・汚れあり" },
  { id: "D", label: "D 難あり", desc: "大きな傷・破損" },
];
const ID_TYPES = ["運転免許証","マイナンバーカード","パスポート","住民基本台帳カード","健康保険証","在留カード","特別永住者証明書"];
const ID_VERIFY_METHODS = ["対面確認","コピー取得","番号記録"];

const cl = {
  bg:"#F4F2ED", surface:"#FFFFFF", surfAlt:"#F9F8F5", border:"#E3DED5",
  bFocus:"#8B7355", accent:"#5C4D33", accentL:"#8B7355", accentBg:"#EDE8DD",
  text:"#2A2215", textM:"#5C5040", textD:"#9B9080",
  danger:"#B14A3F", success:"#3E7A56", white:"#FFFFFF",
  staffBg:"#F0F7F2", staffAccent:"#3E7A56", staffBorder:"#C2DCC9",
  authBg:"#FFF8F0", authAccent:"#C67030", authBorder:"#E8CBA8",
  warnBg:"#FFFBF0", warnBorder:"#E8C840", warnText:"#7A5800",
  overBg:"#F0FFF6", overBorder:"#60C880", overText:"#1A6B3A",
};
const font = "'Noto Sans JP',sans-serif";
const fmt = n => (!n && n !== 0) ? "---" : "¥" + Number(n).toLocaleString();

function getPriceMsg(inputPrice, minPrice, maxPrice) {
  const p = Number(inputPrice), mn = Number(minPrice), mx = Number(maxPrice);
  if (!inputPrice || isNaN(p) || isNaN(mn) || isNaN(mx) || mn <= 0 || mx <= 0) return null;
  if (p < mn) return { type:"under", text:`⚠️ AI査定の下限（${fmt(mn)}）を ${fmt(mn-p)} 下回っています。\nこの金額だとお客様が他店に流れるリスクがあります。交渉余地があれば再検討をご検討ください。` };
  if (p > mx) return { type:"over", text:`🎉 AI査定の上限（${fmt(mx)}）を ${fmt(p-mx)} 上回っています。\n市場相場より高い買取額です。お客様にとって非常に有利な条件となり、ご成約の可能性が高まります！` };
  return null;
}

// ─── 査定プロンプト生成（品目別画像チェックポイント付き） ─────────────
function buildAppraisalPrompt(categoryKey, category, fields, condition, hasImage) {
  const ft = Object.entries(fields).filter(([,v])=>v).map(([k,v])=>"- "+k+": "+v).join("\n");
  const noAccessories = !fields.accessories || fields.accessories.trim()==="";
  const hasConditionDetail = fields.condition_detail && fields.condition_detail.trim().length>0;
  const itemLabel = (fields.brand ? fields.brand+" " : "") + (fields.name || category || "");
  const imageCheckPoints = IMAGE_CHECK_POINTS[categoryKey] || IMAGE_CHECK_POINTS.other;

  return `あなたは出張買取専門のプロ査定士です。以下の手順で査定してください。

【手順1】ウェブ検索で「${itemLabel} 買取価格 相場 ${new Date().getFullYear()}」を必ず検索し、複数の買取店・オークション・フリマの実勢価格を確認する。

【手順2】以下の買取業の基本原則に従い、減額要因を厳密に評価する：
・買取後の再販コスト（クリーニング・点検・撮影・掲載・人件費）が必ず発生する
・在庫リスク（すぐ売れるとは限らない／保管コストが発生する）
・資金拘束リスク（買取から販売まで数週間〜数ヶ月かかる場合がある）
・万が一の返品・クレーム・真贋問題への対応コスト
${noAccessories ? "・【付属品なし】箱・保証書・付属品が揃っていないため、相場比15〜30%の減額が業界標準。必ず減額理由として反映すること。" : ""}
${hasConditionDetail ? `・【状態の詳細あり】「${fields.condition_detail}」という状態が記録されている。この具体的な傷・汚れ・ダメージを減額理由に明示すること。` : ""}
・状態ランク「${condition||"不明"}」に応じた相場下落率を適用する

【手順3】価格幅の設定方針：
・下限と上限の幅は大きく設定してよい（推奨価格の±30〜50%程度が目安）
・下限：最悪ケース（傷悪化・相場下落・長期在庫・付属品なし）を想定した最低ライン
・上限：最良ケース（状態が予想以上に良い・付属品完備・相場上昇・即日成約）を想定した最高ライン
・推奨価格は下限寄りに設定し、スタッフが交渉で上振れできる余地を残す

${hasImage ? `【手順4】画像査定（添付画像を詳細に分析すること）：
${imageCheckPoints}
→ 画像から読み取れた具体的な状態（傷の位置・程度・真贋の疑い等）を reasoning に明記すること
→ 画像が不鮮明・角度不足で判断できない箇所は「要現物確認」と明記すること` : ""}

【手順5】customer_explanation（お客様向け説明文）の方針：
・丁寧・誠実なトーンを保ちながら、減額理由を「なるほど」と思ってもらえる形で具体的に説明する
・「買取後に弊社でかかるクリーニング・点検・販売にかかる費用を考慮した価格です」を自然に盛り込む
${noAccessories ? "・付属品がない点は「付属品（箱・保証書など）が揃っているとさらに高くご提示できるのですが、今回はない分を考慮させていただきました」と伝える" : ""}
${hasConditionDetail ? `・「${fields.condition_detail}という状態が確認できましたので、その点を査定額に反映しております」と具体的に言及する` : ""}
${hasImage ? "・画像から読み取れた具体的なダメージがあれば「〇〇の状態が確認できましたので」と言及する" : ""}
・押しつけがましくならず、「それでもできる限り高くご提示したいと思っています」で締める
・3〜4文で簡潔にまとめる

カテゴリ: ${category||"不明"}
状態ランク: ${condition||"不明"}

商品詳細:
${ft||"（画像から判断）"}

JSONのみ回答:
{"identified_item":"商品名","min_price":0,"max_price":0,"recommended_price":0,"market_price":0,"reasoning":"根拠（画像から読み取れた状態・減額理由・付属品・傷・業界コストを具体的に）","min_price_reason":"下限理由","max_price_reason":"上限理由","price_factors":["減額・加算要因"],"market_trend":"上昇/安定/下降","trend_reason":"理由","confidence":"高/中/低","customer_explanation":"お客様向け説明3-4文"}`;
}

// ─── AI査定（単品） ───────────────────────────────────────────────────
async function callAppraisal({ categoryKey, category, fields, condition, image }) {
  const content = [];
  const supportedTypes = ["image/jpeg","image/png","image/gif","image/webp"];
  const hasImage = !!(image?.base64 && image?.mimeType && supportedTypes.includes(image.mimeType));
  if (hasImage) content.push({ type:"image", source:{ type:"base64", media_type:image.mimeType, data:image.base64 } });
  const prompt = buildAppraisalPrompt(categoryKey, category, fields, condition, hasImage);
  content.push({ type:"text", text:prompt });
  const apiUrl = (typeof window!=="undefined"?window.location.origin:"")+"/api/appraise";
  const res = await fetch(apiUrl,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({content})});
  const data = await res.json();
  if (!res.ok) throw new Error(typeof data.error==="string"?data.error:JSON.stringify(data.error||data));
  if (data.error) throw new Error(typeof data.error==="string"?data.error:JSON.stringify(data.error));
  if (!data.content) throw new Error("応答が空です");
  const txt=(data.content||[]).filter(b=>b.type==="text").map(b=>b.text).join("");
  if (!txt) throw new Error("テキストが空です");
  const m=txt.replace(/```json|```/g,"").trim().match(/\{[\s\S]*\}/);
  if (!m) throw new Error("解析失敗");
  return JSON.parse(m[0]);
}

// ─── AI査定（一括） ───────────────────────────────────────────────────
async function callBulkAppraisal(itemList) {
  const desc = itemList.map((it,i)=>[`【商品${i+1}】`,`品目: ${it.category||"不明"}`,`商品名: ${it.name||"不明"}`,`数量: ${it.quantity||1}点`,`特徴: ${it.feature||"なし"}`,`状態: ${it.condition||"不明"}`].join("\n")).join("\n\n");
  const p = `あなたは出張買取専門のプロ査定士です。ウェブ検索で最新の中古相場を必ず調べてから査定してください。

以下の複数商品をまとめて査定してください。各商品について：
・再販コスト・在庫リスク・資金拘束コストを考慮した買取価格を算出する
・下限と上限の幅は大きく設定してよい（推奨価格の±30〜50%程度）
・推奨価格は下限寄りに設定し、スタッフが交渉で上振れできる余地を残す
・付属品の有無・状態を考慮して減額を適切に反映する
・customer_explanationは「業界のコスト実情」と「具体的な減額理由」を含む3文でまとめる

${desc}

JSONのみ回答（配列）:
[{"item_index":1,"identified_item":"商品名","recommended_price":0,"min_price":0,"max_price":0,"market_price":0,"confidence":"高/中/低","reasoning":"根拠（減額理由を具体的に）","customer_explanation":"説明3文"}]`;
  const content=[{type:"text",text:p}];
  const apiUrl=(typeof window!=="undefined"?window.location.origin:"")+"/api/appraise";
  const res=await fetch(apiUrl,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({content})});
  const data=await res.json();
  if (!res.ok) throw new Error(typeof data.error==="string"?data.error:JSON.stringify(data.error||data));
  if (data.error) throw new Error(typeof data.error==="string"?data.error:JSON.stringify(data.error));
  if (!data.content) throw new Error("応答が空です");
  const txt=(data.content||[]).filter(b=>b.type==="text").map(b=>b.text).join("");
  if (!txt) throw new Error("テキストが空です");
  const m=txt.replace(/```json|```/g,"").trim().match(/\[[\s\S]*\]/);
  if (!m) throw new Error("一括査定の解析に失敗しました");
  return JSON.parse(m[0]);
}

// ─── UIコンポーネント ─────────────────────────────────────────────────
function Input({ label, value, onChange, placeholder, required, multiline, type="text" }) {
  const s={width:"100%",boxSizing:"border-box",padding:"11px 14px",background:cl.surfAlt,border:"1px solid "+cl.border,borderRadius:6,color:cl.text,fontSize:14,fontFamily:font,outline:"none"};
  return (<div style={{marginBottom:14}}><label style={{display:"block",fontSize:12,fontWeight:600,color:cl.textM,marginBottom:5,fontFamily:font}}>{label}{required&&<span style={{color:cl.danger,marginLeft:3}}>*</span>}</label>{multiline?<textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={3} style={{...s,resize:"vertical"}} onFocus={e=>e.target.style.borderColor=cl.bFocus} onBlur={e=>e.target.style.borderColor=cl.border}/>:<input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={s} onFocus={e=>e.target.style.borderColor=cl.bFocus} onBlur={e=>e.target.style.borderColor=cl.border}/>}</div>);
}
function Sel({ label, value, onChange, options, required }) {
  return (<div style={{marginBottom:14}}><label style={{display:"block",fontSize:12,fontWeight:600,color:cl.textM,marginBottom:5,fontFamily:font}}>{label}{required&&<span style={{color:cl.danger,marginLeft:3}}>*</span>}</label><select value={value} onChange={e=>onChange(e.target.value)} style={{width:"100%",padding:"11px 14px",background:cl.surfAlt,border:"1px solid "+cl.border,borderRadius:6,color:cl.text,fontSize:14,fontFamily:font,outline:"none",boxSizing:"border-box"}}><option value="">選択してください</option>{options.map(o=><option key={o.value||o} value={o.value||o}>{o.label||o}</option>)}</select></div>);
}
function Btn({ onClick, children, disabled, loading, variant="primary", small }) {
  const st={primary:{bg:cl.accent,co:cl.white,bd:"none"},secondary:{bg:cl.surface,co:cl.text,bd:"1px solid "+cl.border},danger:{bg:"#FDF2F0",co:cl.danger,bd:"1px solid #E8C4BF"}}[variant]||{bg:cl.accent,co:cl.white,bd:"none"};
  return (<button onClick={onClick} disabled={disabled||loading} style={{width:"100%",padding:small?"8px 12px":"14px",border:st.bd,borderRadius:8,fontSize:small?12:14,fontWeight:700,cursor:disabled?"not-allowed":"pointer",fontFamily:font,background:disabled?"#E0DDD6":st.bg,color:disabled?cl.textD:st.co}}>{loading?<span style={{display:"inline-flex",alignItems:"center",gap:8}}><span style={{display:"inline-block",width:14,height:14,border:"2px solid currentColor",borderTopColor:"transparent",borderRadius:"50%",animation:"spin .7s linear infinite"}}/>処理中...</span>:children}</button>);
}
function Box({ title, sub, children, type }) {
  const bg={staff:cl.staffBg,auth:cl.authBg}[type]||cl.surface;
  const bd={staff:cl.staffBorder,auth:cl.authBorder}[type]||cl.border;
  const co={staff:cl.staffAccent,auth:cl.authAccent}[type]||cl.accent;
  return (<div style={{background:bg,borderRadius:10,border:"1px solid "+bd,padding:18,marginBottom:14}}>{title&&<p style={{margin:"0 0 4px",fontSize:13,fontWeight:700,color:co,fontFamily:font}}>{title}</p>}{sub&&<p style={{margin:"0 0 14px",fontSize:11,color:cl.textD,fontFamily:font}}>{sub}</p>}{children}</div>);
}
function ImageUploader({ images, setImages, photoGuide }) {
  const ref=useRef();
  const add=files=>{Array.from(files).forEach(f=>{if(!f.type.startsWith("image/"))return;const r=new FileReader();r.onload=()=>setImages(p=>[...p,{preview:r.result,base64:r.result.split(",")[1],mimeType:f.type}]);r.readAsDataURL(f);});};
  return (
    <div style={{marginBottom:14}}>
      <div onClick={()=>ref.current?.click()} style={{border:"2px dashed "+cl.border,borderRadius:8,padding:"18px 16px",textAlign:"center",cursor:"pointer",background:cl.surfAlt}}>
        <div style={{width:32,height:32,margin:"0 auto 4px",borderRadius:"50%",border:"2px solid "+cl.textD,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,color:cl.textD}}>+</div>
        <p style={{margin:0,fontSize:12,color:cl.textM,fontFamily:font}}>写真を追加（複数可）</p>
        <input ref={ref} type="file" accept="image/*" multiple capture="environment" style={{display:"none"}} onChange={e=>add(e.target.files)}/>
      </div>
      {images.length>0&&<div style={{display:"flex",gap:8,marginTop:8,flexWrap:"wrap"}}>{images.map((img,i)=>(<div key={i} style={{position:"relative",width:64,height:64,borderRadius:6,overflow:"hidden",border:"1px solid "+cl.border}}><img src={img.preview} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/><button onClick={()=>setImages(p=>p.filter((_,j)=>j!==i))} style={{position:"absolute",top:1,right:1,width:18,height:18,borderRadius:"50%",background:"rgba(0,0,0,.5)",color:"#fff",border:"none",fontSize:10,cursor:"pointer",lineHeight:"16px",padding:0}}>x</button></div>))}</div>}
      {photoGuide&&(
        <div style={{marginTop:10,padding:"12px 14px",background:"#F8F6F1",borderRadius:8,border:"1px solid "+cl.border}}>
          <p style={{margin:"0 0 8px",fontSize:12,fontWeight:700,color:cl.accent,fontFamily:font}}>📷 撮影ガイド（番号順に撮影してください）</p>
          <div style={{display:"flex",flexDirection:"column",gap:4}}>
            {photoGuide.map((g,i)=>(
              <div key={i} style={{display:"flex",alignItems:"flex-start",gap:8,padding:"4px 0",borderBottom:i<photoGuide.length-1?"1px solid "+cl.border:"none"}}>
                <span style={{fontSize:11,color:cl.textM,fontFamily:font,lineHeight:1.6}}>{g}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
function AuthGuide({ authGuide }) {
  if (!authGuide) return null;
  return (<Box title="真贋確認ガイド" type="auth"><p style={{margin:"0 0 12px",fontSize:13,color:cl.text,lineHeight:1.9,fontFamily:font}}>{authGuide.summary}</p><div style={{borderTop:"1px solid "+cl.authBorder,paddingTop:12}}>{authGuide.checks.map((c,i)=>{const[t,...r]=c.split(" — ");return(<div key={i} style={{padding:"10px 12px",background:cl.white,borderRadius:6,marginBottom:6,border:"1px solid "+cl.authBorder}}><p style={{margin:0,fontSize:12,fontWeight:700,color:cl.text,fontFamily:font}}>{t}</p>{r.length>0&&<p style={{margin:"4px 0 0",fontSize:12,color:cl.textM,lineHeight:1.7,fontFamily:font}}>{r.join(" — ")}</p>}</div>);})}</div></Box>);
}
function PriceResult({ result }) {
  const trend=t=>t==="上昇"?"↑ 上昇":t==="下降"?"↓ 下降":"→ 安定";
  return (<>
    {result.identified_item&&<div style={{marginBottom:14,padding:12,background:cl.accentBg,borderRadius:8}}><p style={{margin:0,fontSize:11,color:cl.textM,fontFamily:font}}>識別商品</p><p style={{margin:"4px 0 0",fontSize:14,fontWeight:600,color:cl.text,fontFamily:font}}>{result.identified_item}</p></div>}
    <div style={{background:cl.surface,borderRadius:10,border:"1px solid "+cl.accentL,padding:20,marginBottom:14}}>
      <div style={{textAlign:"center",marginBottom:16}}><p style={{fontSize:11,color:cl.textD,margin:"0 0 2px",fontFamily:font}}>推奨買取価格</p><p style={{fontSize:30,fontWeight:800,color:cl.accent,margin:0,fontFamily:font}}>{fmt(result.recommended_price)}</p></div>
      <div style={{marginBottom:16}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:11,color:cl.textD,fontFamily:font}}>下限</span><span style={{fontSize:11,color:cl.textD,fontFamily:font}}>上限</span></div>
        <div style={{position:"relative",height:8,background:"#E8E4DC",borderRadius:4}}><div style={{position:"absolute",left:0,top:0,height:"100%",width:"100%",background:"linear-gradient(90deg,"+cl.danger+"40,"+cl.success+"40)",borderRadius:4}}/>{result.max_price>result.min_price&&(()=>{const p=((result.recommended_price-result.min_price)/(result.max_price-result.min_price))*100;return<div style={{position:"absolute",top:-3,left:Math.min(Math.max(p,5),95)+"%",transform:"translateX(-50%)",width:14,height:14,background:cl.accent,borderRadius:"50%",border:"2px solid "+cl.white,boxShadow:"0 1px 3px rgba(0,0,0,.2)"}}/>;})()}</div>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}><span style={{fontSize:13,fontWeight:700,color:cl.text,fontFamily:font}}>{fmt(result.min_price)}</span><span style={{fontSize:13,fontWeight:700,color:cl.text,fontFamily:font}}>{fmt(result.max_price)}</span></div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
        <div style={{padding:"8px 10px",background:"#FDF5F4",borderRadius:6,borderLeft:"3px solid "+cl.danger}}><p style={{margin:0,fontSize:10,fontWeight:600,color:cl.danger,fontFamily:font}}>下限の理由</p><p style={{margin:"3px 0 0",fontSize:11,color:cl.text,lineHeight:1.5,fontFamily:font}}>{result.min_price_reason||"—"}</p></div>
        <div style={{padding:"8px 10px",background:"#F2F8F4",borderRadius:6,borderLeft:"3px solid "+cl.success}}><p style={{margin:0,fontSize:10,fontWeight:600,color:cl.success,fontFamily:font}}>上限の理由</p><p style={{margin:"3px 0 0",fontSize:11,color:cl.text,lineHeight:1.5,fontFamily:font}}>{result.max_price_reason||"—"}</p></div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>{[["相場",fmt(result.market_price),cl.text],["動向",trend(result.market_trend),cl.text],["信頼度",result.confidence,result.confidence==="高"?cl.success:result.confidence==="低"?cl.danger:cl.accent]].map(([l,v,co])=>(<div key={l} style={{padding:"6px 8px",background:cl.surfAlt,borderRadius:6}}><p style={{fontSize:10,color:cl.textD,margin:0,fontFamily:font}}>{l}</p><p style={{fontSize:12,fontWeight:600,color:co,margin:"2px 0 0",fontFamily:font}}>{v}</p></div>))}</div>
    </div>
    <Box title="査定根拠"><p style={{fontSize:12,color:cl.text,margin:0,lineHeight:1.8,fontFamily:font}}>{result.reasoning}</p>{result.price_factors?.map((f,i)=><div key={i} style={{padding:"6px 10px",background:cl.surfAlt,borderRadius:4,marginTop:6,fontSize:11,color:cl.textM,fontFamily:font,borderLeft:"3px solid "+cl.accentL}}>{f}</div>)}</Box>
    {result.customer_explanation&&<Box title="お客様への説明文" type="staff"><p style={{margin:0,fontSize:13,color:cl.text,lineHeight:2,fontFamily:font}}>{result.customer_explanation}</p></Box>}
  </>);
}
function BulkResultCard({ result, index }) {
  const [open,setOpen]=useState(false);
  return (<div style={{background:cl.surface,borderRadius:8,border:"1px solid "+cl.border,marginBottom:10,overflow:"hidden"}}><div onClick={()=>setOpen(o=>!o)} style={{padding:"12px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",background:cl.surfAlt}}><div><p style={{margin:0,fontSize:12,fontWeight:700,color:cl.text,fontFamily:font}}>商品{index+1}：{result.identified_item||"不明"}</p><p style={{margin:"2px 0 0",fontSize:11,color:cl.textM,fontFamily:font}}>信頼度: {result.confidence} ／ 推奨: {fmt(result.recommended_price)}</p></div><span style={{fontSize:18,color:cl.textD}}>{open?"▲":"▼"}</span></div>{open&&<div style={{padding:"12px 14px"}}><div style={{display:"flex",gap:8,marginBottom:10}}>{[["下限",fmt(result.min_price),cl.danger],["推奨",fmt(result.recommended_price),cl.accent],["上限",fmt(result.max_price),cl.success]].map(([l,v,co])=>(<div key={l} style={{flex:1,padding:"8px 6px",background:cl.surfAlt,borderRadius:6,textAlign:"center"}}><p style={{margin:0,fontSize:10,color:cl.textD,fontFamily:font}}>{l}</p><p style={{margin:"2px 0 0",fontSize:13,fontWeight:700,color:co,fontFamily:font}}>{v}</p></div>))}</div><p style={{margin:0,fontSize:11,color:cl.textM,lineHeight:1.7,fontFamily:font}}>{result.reasoning}</p>{result.customer_explanation&&<div style={{marginTop:8,padding:"8px 10px",background:cl.staffBg,borderRadius:6,border:"1px solid "+cl.staffBorder}}><p style={{margin:0,fontSize:11,color:cl.text,lineHeight:1.7,fontFamily:font}}>{result.customer_explanation}</p></div>}</div>}</div>);
}
function LedgerItemCard({ it, idx, itemCount, onUpdate, onDelete }) {
  const msg=getPriceMsg(it.purchasePrice,it.aiMinPrice,it.aiMaxPrice);
  const isUnder=msg?.type==="under";
  return (<Box title={"商品 "+(idx+1)}>
    <Sel label="品目（カテゴリ）" value={it.category} onChange={v=>onUpdate(idx,"category",v)} options={Object.values(CATEGORY_CONFIG).map(c=>({value:c.label,label:c.label}))}/>
    <Input label="商品名" value={it.name} onChange={v=>onUpdate(idx,"name",v)} required placeholder="例: ロレックス デイトナ"/>
    <Input label="数量" value={it.quantity} onChange={v=>onUpdate(idx,"quantity",v)} placeholder="例: 1" type="number"/>
    <Input label="特徴・詳細" value={it.feature} onChange={v=>onUpdate(idx,"feature",v)} placeholder="色、付属品、状態など" multiline/>
    <Input label="買取金額（円）" value={it.purchasePrice} onChange={v=>onUpdate(idx,"purchasePrice",v)} type="number" required/>
    {it.aiEstimate&&<div style={{padding:"8px 12px",background:cl.accentBg,borderRadius:6,marginBottom:10,border:"1px solid "+cl.accentL}}><p style={{margin:0,fontSize:11,color:cl.textM,fontFamily:font}}>AI査定目安（推奨）：<span style={{fontWeight:700,color:cl.accent}}>{it.aiEstimate}</span>{it.aiMinPrice&&it.aiMaxPrice&&<span style={{color:cl.textD,marginLeft:6,fontSize:10}}>（下限 {fmt(it.aiMinPrice)} 〜 上限 {fmt(it.aiMaxPrice)}）</span>}</p></div>}
    {msg&&<div style={{padding:"12px 14px",background:isUnder?cl.warnBg:cl.overBg,border:"1px solid "+(isUnder?cl.warnBorder:cl.overBorder),borderRadius:8,marginBottom:10}}><p style={{margin:0,fontSize:12,color:isUnder?cl.warnText:cl.overText,lineHeight:1.8,fontFamily:font,whiteSpace:"pre-line"}}>{msg.text}</p></div>}
    <Input label="備考" value={it.remarks} onChange={v=>onUpdate(idx,"remarks",v)} placeholder="付属品、状態など" multiline/>
    {itemCount>1&&<div style={{marginTop:4}}><Btn onClick={()=>onDelete(idx)} variant="danger" small>この商品を削除</Btn></div>}
  </Box>);
}

// ─── 査定タブ ─────────────────────────────────────────────────────────
function AppraisalTab({ staffName, onSendToLedger }) {
  const [mode,setMode]=useState("single");
  const [customerName,setCustomerName]=useState("");
  const [catId,setCatId]=useState("");
  const [fields,setFields]=useState({});
  const [cond,setCond]=useState("");
  const [images,setImages]=useState([]);
  const [loading,setLoading]=useState(false);
  const [result,setResult]=useState(null);
  const [error,setError]=useState("");
  const emptyBulkItem={category:"",name:"",quantity:"1",feature:"",condition:""};
  const [bulkCustomerName,setBulkCustomerName]=useState("");
  const [bulkItems,setBulkItems]=useState([{...emptyBulkItem}]);
  const [bulkLoading,setBulkLoading]=useState(false);
  const [bulkResults,setBulkResults]=useState([]);
  const [bulkError,setBulkError]=useState("");

  const config=CATEGORY_CONFIG[catId];
  const hasImg=images.length>0;
  const hasReq=config?config.fields.filter(f=>f.required).every(f=>fields[f.key]?.trim()):false;
  const singleOk=catId&&(hasImg||hasReq);
  const bulkOk=bulkItems.every(it=>it.name.trim());

  const runSingle=async()=>{
    setLoading(true);setError("");setResult(null);
    try {
      const data=await callAppraisal({
        categoryKey:catId,
        category:config?.label||"",
        fields,
        condition:CONDITIONS.find(x=>x.id===cond)?.label||cond,
        image:images[0]||null,
      });
      setResult(data);
      try {
        await gasPost({
          action:"saveAppraisalLog",
          customerName:customerName.trim(),
          itemName:data.identified_item||fields.name||"",
          priceEstimate:fmt(data.recommended_price),
          minPrice:fmt(data.min_price),
          maxPrice:fmt(data.max_price),
          reasoning:data.reasoning||"",
          customerExplanation:data.customer_explanation||"",
          staffName:staffName||"",
          remarks:config?.label||"",
          appraisalType:"単品",
          imageBase64:images[0]?.base64||"",
          imageMimeType:images[0]?.mimeType||"",
        });
      } catch(e){}
    } catch(e){setError(e.message||"査定失敗");}
    setLoading(false);
  };

  const runBulk=async()=>{
    setBulkLoading(true);setBulkError("");setBulkResults([]);
    try {
      const results=await callBulkAppraisal(bulkItems);
      setBulkResults(results);
      for (const r of results) {
        try {
          await gasPost({action:"saveAppraisalLog",customerName:bulkCustomerName.trim(),itemName:r.identified_item||"",priceEstimate:fmt(r.recommended_price),minPrice:fmt(r.min_price),maxPrice:fmt(r.max_price),reasoning:r.reasoning||"",customerExplanation:r.customer_explanation||"",staffName:staffName||"",remarks:"一括査定",appraisalType:"一括",imageBase64:"",imageMimeType:""});
        } catch(e){}
      }
    } catch(e){setBulkError(e.message||"一括査定失敗");}
    setBulkLoading(false);
  };

  const sendSingleToLedger=()=>{
    if (!result) return;
    onSendToLedger({customerName,items:[{category:config?.label||"",name:result.identified_item||fields.name||"",quantity:"1",feature:fields.condition_detail||"",purchasePrice:String(result.recommended_price||""),aiEstimate:fmt(result.recommended_price),aiMinPrice:result.min_price,aiMaxPrice:result.max_price,aiRecommendedPrice:result.recommended_price,remarks:""}]});
  };
  const sendBulkToLedger=()=>{
    if (!bulkResults.length) return;
    const items=bulkItems.map((it,i)=>{const r=bulkResults.find(r=>r.item_index===i+1)||bulkResults[i]||{};return{category:it.category,name:r.identified_item||it.name,quantity:it.quantity||"1",feature:it.feature||"",purchasePrice:String(r.recommended_price||""),aiEstimate:fmt(r.recommended_price),aiMinPrice:r.min_price,aiMaxPrice:r.max_price,aiRecommendedPrice:r.recommended_price,remarks:""};});
    onSendToLedger({customerName:bulkCustomerName,items});
  };
  const updBulk=(idx,k,v)=>setBulkItems(p=>p.map((it,i)=>i===idx?{...it,[k]:v}:it));

  return (
    <div style={{padding:16}}>
      <div style={{display:"flex",background:cl.surface,border:"1px solid "+cl.border,borderRadius:8,marginBottom:16,overflow:"hidden"}}>
        {[["single","単品査定"],["bulk","一括査定"]].map(([id,label])=>(
          <button key={id} onClick={()=>setMode(id)} style={{flex:1,padding:"11px 0",background:mode===id?cl.accentBg:"transparent",border:"none",color:mode===id?cl.accent:cl.textD,fontSize:13,fontWeight:mode===id?700:400,cursor:"pointer",fontFamily:font}}>{label}</button>
        ))}
      </div>

      {mode==="single"&&<>
        <Box title="顧客名"><Input label="顧客名" value={customerName} onChange={setCustomerName} placeholder="例: 山田 太郎"/></Box>
        <Box title="カテゴリを選択">
          <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:6}}>
            {Object.entries(CATEGORY_CONFIG).map(([id,cfg])=>(
              <button key={id} onClick={()=>{setCatId(id);setFields({});setResult(null);setError("");setImages([]);}} style={{padding:"9px 10px",textAlign:"left",cursor:"pointer",background:catId===id?cl.accentBg:cl.surfAlt,border:"1px solid "+(catId===id?cl.accentL:cl.border),borderRadius:6}}>
                <span style={{fontSize:12,fontWeight:600,color:catId===id?cl.accent:cl.text,display:"block",fontFamily:font}}>{cfg.label}</span>
                <span style={{fontSize:10,color:cl.textD,fontFamily:font}}>{cfg.examples}</span>
              </button>
            ))}
          </div>
        </Box>
        {catId&&config&&<>
          {config.authGuide&&<AuthGuide authGuide={config.authGuide}/>}
          <Box title="商品写真">
            <ImageUploader images={images} setImages={setImages} photoGuide={config.photoGuide}/>
            {images.length>0&&<p style={{margin:"8px 0 0",fontSize:11,color:cl.staffAccent,fontFamily:font,textAlign:"center"}}>✅ {images.length}枚の写真をAIが詳細分析します</p>}
          </Box>
          <Box title={config.label+"の詳細"} sub="わかる範囲で">
            {config.fields.map(f=><Input key={f.key} label={f.label} value={fields[f.key]||""} onChange={v=>setFields(p=>({...p,[f.key]:v}))} placeholder={f.placeholder} required={f.required} multiline={f.multiline}/>)}
            <Sel label="状態ランク" value={cond} onChange={setCond} options={CONDITIONS.map(x=>({value:x.id,label:x.label+" — "+x.desc}))}/>
          </Box>
          <Btn onClick={runSingle} disabled={!singleOk} loading={loading}>
            {images.length>0?`AI査定を実行（写真${images.length}枚で画像分析）`:"AI査定を実行"}
          </Btn>
        </>}
        {error&&<div style={{marginTop:14,padding:14,background:"#FDF2F0",border:"1px solid #E8C4BF",borderRadius:8}}><p style={{color:cl.danger,margin:0,fontSize:12,fontFamily:font,wordBreak:"break-word"}}>{error}</p></div>}
        {result&&<div style={{marginTop:20}}><PriceResult result={result}/><div style={{marginTop:12}}><Btn onClick={sendSingleToLedger} variant="secondary">📋 この査定内容を台帳に引き継ぐ</Btn></div></div>}
      </>}

      {mode==="bulk"&&<>
        <Box title="顧客名"><Input label="顧客名" value={bulkCustomerName} onChange={setBulkCustomerName} placeholder="例: 山田 太郎"/></Box>
        {bulkItems.map((it,idx)=>(
          <Box key={idx} title={"商品 "+(idx+1)}>
            <Sel label="品目（カテゴリ）" value={it.category} onChange={v=>updBulk(idx,"category",v)} options={Object.values(CATEGORY_CONFIG).map(c=>({value:c.label,label:c.label}))}/>
            <Input label="商品名" value={it.name} onChange={v=>updBulk(idx,"name",v)} placeholder="例: ルイヴィトン ネヴァーフル" required/>
            <Input label="数量" value={it.quantity} onChange={v=>updBulk(idx,"quantity",v)} placeholder="例: 1" type="number"/>
            <Input label="特徴・詳細" value={it.feature} onChange={v=>updBulk(idx,"feature",v)} placeholder="色、サイズ、付属品など" multiline/>
            <Sel label="状態ランク" value={it.condition} onChange={v=>updBulk(idx,"condition",v)} options={CONDITIONS.map(x=>({value:x.label,label:x.label+" — "+x.desc}))}/>
            {bulkItems.length>1&&<div style={{marginTop:8}}><Btn onClick={()=>setBulkItems(p=>p.filter((_,i)=>i!==idx))} variant="danger" small>この商品を削除</Btn></div>}
          </Box>
        ))}
        <div style={{marginBottom:14}}><Btn onClick={()=>setBulkItems(p=>[...p,{...emptyBulkItem}])} variant="secondary">+ 商品を追加</Btn></div>
        <Btn onClick={runBulk} disabled={!bulkOk} loading={bulkLoading}>一括AI査定を実行（{bulkItems.length}点）</Btn>
        {bulkError&&<div style={{marginTop:14,padding:14,background:"#FDF2F0",border:"1px solid #E8C4BF",borderRadius:8}}><p style={{color:cl.danger,margin:0,fontSize:12,fontFamily:font}}>{bulkError}</p></div>}
        {bulkResults.length>0&&<div style={{marginTop:20}}>
          <p style={{fontSize:13,fontWeight:700,color:cl.accent,marginBottom:10,fontFamily:font}}>一括査定結果（{bulkResults.length}点）</p>
          {bulkResults.map((r,i)=><BulkResultCard key={i} result={r} index={i}/>)}
          <div style={{marginTop:12}}><Btn onClick={sendBulkToLedger} variant="secondary">📋 一括査定結果を台帳に引き継ぐ</Btn></div>
        </div>}
      </>}
    </div>
  );
}

// ─── 台帳タブ ─────────────────────────────────────────────────────────
function LegalTab({ staffName, pendingLedger, onPendingConsumed }) {
  const now=new Date();
  const ds=now.getFullYear()+"-"+String(now.getMonth()+1).padStart(2,"0")+"-"+String(now.getDate()).padStart(2,"0");
  const emptyItem={category:"",name:"",quantity:"1",feature:"",purchasePrice:"",remarks:"",aiEstimate:"",aiMinPrice:null,aiMaxPrice:null,aiRecommendedPrice:null};
  const makeEmptyVisit=()=>({date:ds,staffName:staffName||"",sellerName:"",sellerPhone:"",sellerAddress:"",sellerOccupation:"",sellerAge:"",sellerIdType:"",sellerIdNumber:"",idVerifyMethod:"",idVerifiedBy:staffName||""});
  const [visit,setVisit]=useState(makeEmptyVisit());
  const [items,setItems]=useState([{...emptyItem}]);
  const [saving,setSaving]=useState(false);
  const [saved,setSaved]=useState("");
  const [error,setError]=useState("");
  const [showBanner,setShowBanner]=useState(false);
  const uv=(k,v)=>setVisit(p=>({...p,[k]:v}));
  const ui=(idx,k,v)=>setItems(p=>p.map((it,i)=>i===idx?{...it,[k]:v}:it));

  useEffect(()=>{
    if (!pendingLedger) return;
    setVisit(p=>({...p,sellerName:pendingLedger.customerName||p.sellerName}));
    if (pendingLedger.items?.length>0) {
      setItems(pendingLedger.items.map(it=>({category:it.category||"",name:it.name||"",quantity:it.quantity||"1",feature:it.feature||"",purchasePrice:it.purchasePrice||"",remarks:it.remarks||"",aiEstimate:it.aiEstimate||"",aiMinPrice:it.aiMinPrice||null,aiMaxPrice:it.aiMaxPrice||null,aiRecommendedPrice:it.aiRecommendedPrice||null})));
    }
    setShowBanner(true);
    onPendingConsumed();
  },[pendingLedger]);

  const visReq=["sellerName","sellerPhone","sellerAddress","sellerIdType","sellerIdNumber","staffName"];
  const formOk=visReq.every(f=>visit[f]?.trim())&&items.every(it=>it.name?.trim()&&it.purchasePrice?.trim());
  const resetForm=()=>{setVisit(makeEmptyVisit());setItems([{...emptyItem}]);setShowBanner(false);};

  const save=async()=>{
    setSaving(true);setError("");setSaved("");
    try {
      const data=await gasPost({action:"saveLedger",transactionDate:visit.date,sellerName:visit.sellerName,sellerPhone:visit.sellerPhone,sellerAddress:visit.sellerAddress,sellerOccupation:visit.sellerOccupation,sellerAge:visit.sellerAge,sellerIdType:visit.sellerIdType,sellerIdNumber:visit.sellerIdNumber,idVerifyMethod:visit.idVerifyMethod,idVerifiedBy:visit.idVerifiedBy,staffName:visit.staffName,items:items.map(it=>({category:it.category,name:it.name,quantity:it.quantity||"1",feature:it.feature,purchasePrice:it.purchasePrice,remarks:it.remarks,aiEstimate:it.aiEstimate}))});
      setSaved("保存完了（案件ID: "+data.caseId+"）");
      resetForm();
    } catch(e){setError(e.message||"保存に失敗しました");}
    setSaving(false);
  };

  return (
    <div style={{padding:16}}>
      {showBanner&&<div style={{padding:"12px 14px",background:"#F0F7F2",border:"1px solid "+cl.staffBorder,borderRadius:8,marginBottom:14,display:"flex",alignItems:"center",justifyContent:"space-between"}}><p style={{margin:0,fontSize:12,color:cl.staffAccent,fontWeight:600,fontFamily:font}}>📋 査定画面の内容を反映しました。手修正してから保存してください。</p><button onClick={()=>setShowBanner(false)} style={{background:"none",border:"none",fontSize:16,cursor:"pointer",color:cl.textD}}>×</button></div>}
      <div style={{background:cl.accentBg,borderRadius:8,padding:14,marginBottom:16,border:"1px solid "+cl.accentL}}><p style={{fontSize:12,fontWeight:700,color:cl.accent,margin:"0 0 6px",fontFamily:font}}>古物営業法に基づく記録義務</p><p style={{fontSize:11,color:cl.textM,margin:0,lineHeight:1.7,fontFamily:font}}>第16条・第17条により記録・3年間保存義務があります。</p></div>
      <Box title="取引情報"><Input label="取引日" value={visit.date} onChange={v=>uv("date",v)} type="date" required/><Input label="担当者" value={visit.staffName} onChange={v=>uv("staffName",v)} required placeholder="担当者名"/></Box>
      <Box title="売主情報"><Input label="氏名" value={visit.sellerName} onChange={v=>uv("sellerName",v)} required placeholder="山田 太郎"/><Input label="住所" value={visit.sellerAddress} onChange={v=>uv("sellerAddress",v)} required placeholder="東京都○○区○○"/><Input label="電話番号" value={visit.sellerPhone} onChange={v=>uv("sellerPhone",v)} required placeholder="090-XXXX-XXXX"/><Input label="職業" value={visit.sellerOccupation} onChange={v=>uv("sellerOccupation",v)} placeholder="例: 会社員"/><Input label="年齢" value={visit.sellerAge} onChange={v=>uv("sellerAge",v)} placeholder="例: 35" type="number"/></Box>
      <Box title="本人確認"><Sel label="身分証の種類" value={visit.sellerIdType} onChange={v=>uv("sellerIdType",v)} options={ID_TYPES} required/><Input label="身分証番号" value={visit.sellerIdNumber} onChange={v=>uv("sellerIdNumber",v)} required placeholder="番号"/><Sel label="本人確認方法" value={visit.idVerifyMethod} onChange={v=>uv("idVerifyMethod",v)} options={ID_VERIFY_METHODS}/><Input label="確認者" value={visit.idVerifiedBy} onChange={v=>uv("idVerifiedBy",v)} required placeholder="確認者名"/></Box>
      {items.map((it,idx)=><LedgerItemCard key={idx} it={it} idx={idx} itemCount={items.length} onUpdate={ui} onDelete={i=>setItems(p=>p.filter((_,j)=>j!==i))}/>)}
      <div style={{marginBottom:14}}><Btn onClick={()=>setItems(p=>[...p,{...emptyItem}])} variant="secondary">+ 商品を追加</Btn></div>
      <Btn onClick={save} disabled={saving||!formOk} loading={saving}>保存</Btn>
      {saved&&<div style={{marginTop:10,padding:12,background:"#F0F7F2",border:"1px solid "+cl.staffBorder,borderRadius:8}}><p style={{margin:0,fontSize:13,fontWeight:600,color:cl.success,fontFamily:font}}>{saved}</p></div>}
      {error&&<div style={{marginTop:10,padding:12,background:"#FDF2F0",border:"1px solid #E8C4BF",borderRadius:8}}><p style={{margin:0,fontSize:12,color:cl.danger,fontFamily:font}}>{error}</p></div>}
      {!formOk&&!saved&&<p style={{fontSize:11,color:cl.danger,textAlign:"center",marginTop:8,fontFamily:font}}>必須項目（*）と各商品の商品名・金額を入力してください</p>}
    </div>
  );
}

function LoginScreen({ onLogin }) {
  const [staffId,setStaffId]=useState(""); const [password,setPassword]=useState(""); const [loading,setLoading]=useState(false); const [err,setErr]=useState("");
  const go=async()=>{
    if (!staffId.trim()||!password.trim()){setErr("IDとパスワードを入力してください");return;}
    if (!/^\d{4}$/.test(password)){setErr("パスワードは4桁の数字です");return;}
    setLoading(true);setErr("");
    try{const data=await gasPost({action:"login",staffId:staffId.trim(),password:password.trim()});onLogin({staffId:data.staffId,staffName:data.staffName});}catch(e){setErr(e.message||"ログイン失敗");}
    setLoading(false);
  };
  return (<div style={{maxWidth:400,margin:"0 auto",minHeight:"100vh",background:cl.bg,fontFamily:font,display:"flex",flexDirection:"column",justifyContent:"center",padding:24}}><div style={{textAlign:"center",marginBottom:36}}><h1 style={{fontSize:20,fontWeight:800,color:cl.accent,margin:"0 0 4px",letterSpacing:2}}>出張買取</h1><p style={{fontSize:12,color:cl.textD,margin:0}}>AI査定 ・ 古物台帳記録</p></div><Box title="スタッフログイン"><Input label="スタッフID" value={staffId} onChange={setStaffId} placeholder="例: staff001" required/><Input label="パスワード（4桁）" value={password} onChange={setPassword} placeholder="4桁の数字" type="password" required/><Btn onClick={go} disabled={!staffId.trim()||!password.trim()} loading={loading}>ログイン</Btn>{err&&<p style={{fontSize:12,color:cl.danger,textAlign:"center",marginTop:10,fontFamily:font}}>{err}</p>}</Box></div>);
}

export default function Home() {
  const [user,setUser]=useState(null); const [tab,setTab]=useState("appraisal"); const [mounted,setMounted]=useState(false); const [pendingLedger,setPendingLedger]=useState(null);
  useEffect(()=>{setMounted(true);},[]);
  if (!mounted) return null;
  if (!user) return <LoginScreen onLogin={setUser}/>;
  const handleSendToLedger=data=>{setPendingLedger(data);setTab("legal");};
  const tabs=[{id:"appraisal",label:"査定"},{id:"legal",label:"台帳記録"}];
  return (
    <div style={{maxWidth:480,margin:"0 auto",minHeight:"100vh",background:cl.bg,fontFamily:font}}>
      <style>{"@keyframes spin{to{transform:rotate(360deg)}}*{box-sizing:border-box}input,select,textarea{font-family:'Noto Sans JP',sans-serif}input::-webkit-outer-spin-button,input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}"}</style>
      <div style={{padding:"14px 16px",background:cl.surface,borderBottom:"1px solid "+cl.border,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div><h1 style={{margin:0,fontSize:16,fontWeight:800,color:cl.accent,letterSpacing:1.5}}>出張買取</h1><p style={{margin:"1px 0 0",fontSize:10,color:cl.textD}}>{user.staffName}さん</p></div>
        <button onClick={()=>setUser(null)} style={{background:"none",border:"1px solid "+cl.border,borderRadius:4,padding:"4px 10px",fontSize:10,color:cl.textD,cursor:"pointer",fontFamily:font}}>ログアウト</button>
      </div>
      <div style={{display:"flex",background:cl.surface,borderBottom:"1px solid "+cl.border,position:"sticky",top:0,zIndex:100}}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:"11px 0",background:"none",border:"none",borderBottom:tab===t.id?"2px solid "+cl.accent:"2px solid transparent",color:tab===t.id?cl.accent:cl.textD,fontSize:12,fontWeight:tab===t.id?700:400,cursor:"pointer",fontFamily:font}}>
            {t.label}{t.id==="legal"&&pendingLedger&&<span style={{marginLeft:4,background:cl.accent,color:cl.white,borderRadius:"50%",fontSize:9,padding:"1px 5px"}}>●</span>}
          </button>
        ))}
      </div>
      {tab==="appraisal"&&<AppraisalTab staffName={user.staffName} onSendToLedger={handleSendToLedger}/>}
      {tab==="legal"&&<LegalTab staffName={user.staffName} pendingLedger={pendingLedger} onPendingConsumed={()=>setPendingLedger(null)}/>}
    </div>
  );
}
