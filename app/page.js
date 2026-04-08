"use client";
import { useState, useEffect, useRef } from "react";

const CATEGORIES = [
  { id: "brand_bag", label: "ブランドバッグ", examples: "ルイヴィトン, シャネル, エルメス" },
  { id: "brand_watch", label: "腕時計", examples: "ロレックス, オメガ, カルティエ" },
  { id: "jewelry", label: "ジュエリー・宝石", examples: "ダイヤ, 金, プラチナ" },
  { id: "brand_clothes", label: "ブランド衣類", examples: "グッチ, プラダ, バーバリー" },
  { id: "electronics", label: "家電・電子機器", examples: "iPhone, カメラ, PC" },
  { id: "antique", label: "骨董品・美術品", examples: "掛軸, 茶道具, 陶磁器" },
  { id: "musical", label: "楽器", examples: "ギター, ピアノ, バイオリン" },
  { id: "liquor", label: "お酒", examples: "ウイスキー, ワイン, 日本酒" },
  { id: "gold_metal", label: "金・貴金属", examples: "金地金, 金貨, プラチナ" },
  { id: "other", label: "その他", examples: "フィギュア, ブランド食器 等" },
];
const CONDITIONS = [
  { id: "S", label: "S 新品同様", desc: "未使用・タグ付き" },
  { id: "A", label: "A 美品", desc: "使用感ほぼなし" },
  { id: "B", label: "B 良好", desc: "多少の使用感あり" },
  { id: "C", label: "C やや難あり", desc: "傷・汚れあり" },
  { id: "D", label: "D 難あり", desc: "大きな傷・破損あり" },
];
const ID_TYPES = ["運転免許証","マイナンバーカード","パスポート","住民基本台帳カード","健康保険証","在留カード","特別永住者証明書"];

const cl = {
  bg: "#F4F2ED", surface: "#FFFFFF", surfAlt: "#F9F8F5",
  border: "#E3DED5", bFocus: "#8B7355",
  accent: "#5C4D33", accentL: "#8B7355", accentBg: "#EDE8DD",
  text: "#2A2215", textM: "#5C5040", textD: "#9B9080",
  danger: "#B14A3F", success: "#3E7A56", white: "#FFFFFF",
  adminBg: "#EBF0F7", adminAccent: "#3D5A80", adminBorder: "#C6D4E3",
  staffBg: "#F0F7F2", staffAccent: "#3E7A56", staffBorder: "#C2DCC9",
};
const font = "'Noto Sans JP',sans-serif";
const fmt = n => (!n && n !== 0) ? "---" : "¥" + Number(n).toLocaleString();

async function callAppraisal({ category, brand, name, condition, accessories, notes, imageBase64 }) {
  const content = [];
  if (imageBase64) content.push({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: imageBase64 } });
  let p = "あなたはプロの買取査定士兼リセール戦略アドバイザーです。";
  if (imageBase64) p += "添付された商品画像を注意深く観察し、ブランド・型番・状態・素材・年代などを読み取ってください。\n\n";
  p += "以下の商品情報をもとに、現在の日本の中古市場における適正な買取価格と、販売戦略情報を査定してください。\n\n商品情報:\n- カテゴリ: " + (category || "（画像から判断）") + "\n- ブランド/メーカー: " + (brand || "（画像から判断）") + "\n- 商品名/型番: " + (name || "（画像から判断）") + "\n- 状態: " + (condition || "（画像から判断）") + "\n- 付属品: " + (accessories || "なし") + "\n- 特記事項: " + (notes || "なし") + '\n\n以下のJSON形式のみで回答してください。他の文字列は一切含めないでください。\n売却先候補は、必ずウェブ検索で現在実在する具体的な業者名・サービス名・オークション名を調べて記載してください:\n{\n  "identified_item": "特定した商品の詳細",\n  "min_price": 数値,\n  "max_price": 数値,\n  "recommended_price": 数値,\n  "market_price": 数値,\n  "reasoning": "査定根拠の詳細",\n  "min_price_reason": "下限価格の具体的理由",\n  "max_price_reason": "上限価格の具体的理由",\n  "price_factors": ["要因1","要因2","要因3"],\n  "market_trend": "上昇" or "安定" or "下降",\n  "trend_reason": "トレンド理由",\n  "confidence": "高" or "中" or "低",\n  "sales_channels": [\n    {\n      "name": "具体的な売却先名",\n      "type": "オークション / 業者間取引 / 自社EC / フリマ / 専門買取業者 / 委託販売 等",\n      "expected_sell_price": 数値,\n      "gross_profit": 数値,\n      "gross_profit_rate": "パーセンテージ",\n      "priority": 1から順の数値,\n      "reason": "この販路を推奨する理由"\n    }\n  ],\n  "purchase_upper_limit": 数値,\n  "purchase_limit_reason": "仕入れ上限の根拠",\n  "inventory_strategy": "在庫向き" or "即売り向き",\n  "inventory_reason": "在庫/即売り判断の理由",\n  "recommended_channel": "最も推奨する売却先名",\n  "admin_memo": "管理者向けの総合アドバイス",\n  "customer_explanation": "お客様への査定説明文。短く自然に。内部情報は出さない。3〜4文程度。"\n}';
  content.push({ type: "text", text: p });
  const res = await fetch("/api/appraise", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  const text = data.content?.filter(b => b.type === "text").map(b => b.text).join("");
  return JSON.parse(text.replace(/```json|```/g, "").trim());
}

function loadRecords() { try { const s = localStorage.getItem("kaitori-records"); return s ? JSON.parse(s) : []; } catch { return []; } }
function saveRecords(records) { try { localStorage.setItem("kaitori-records", JSON.stringify(records)); } catch {} }

function Input({ label, value, onChange, placeholder, required, multiline, type = "text", disabled }) {
  const s = { width: "100%", boxSizing: "border-box", padding: "11px 14px", background: disabled ? "#EEEDEA" : cl.surfAlt, border: "1px solid " + cl.border, borderRadius: 6, color: cl.text, fontSize: 14, fontFamily: font, outline: "none", transition: "border .15s", opacity: disabled ? .7 : 1 };
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: cl.textM, marginBottom: 5, fontFamily: font }}>{label}{required && <span style={{ color: cl.danger, marginLeft: 3 }}>*</span>}</label>
      {multiline
        ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3} style={{ ...s, resize: "vertical" }} disabled={disabled} onFocus={e => { if (!disabled) e.target.style.borderColor = cl.bFocus }} onBlur={e => e.target.style.borderColor = cl.border} />
        : <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={s} disabled={disabled} onFocus={e => { if (!disabled) e.target.style.borderColor = cl.bFocus }} onBlur={e => e.target.style.borderColor = cl.border} />}
    </div>
  );
}
function Select({ label, value, onChange, options, required }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: cl.textM, marginBottom: 5, fontFamily: font }}>{label}{required && <span style={{ color: cl.danger, marginLeft: 3 }}>*</span>}</label>
      <select value={value} onChange={e => onChange(e.target.value)} style={{ width: "100%", padding: "11px 14px", background: cl.surfAlt, border: "1px solid " + cl.border, borderRadius: 6, color: cl.text, fontSize: 14, fontFamily: font, outline: "none", boxSizing: "border-box" }}>
        <option value="">選択してください</option>
        {options.map(o => <option key={o.value || o} value={o.value || o}>{o.label || o}</option>)}
      </select>
    </div>
  );
}
function Btn({ onClick, children, disabled, loading, variant = "primary" }) {
  const styles = { primary: { bg: cl.accent, co: cl.white, bd: "none" }, secondary: { bg: cl.surface, co: cl.text, bd: "1px solid " + cl.border }, admin: { bg: cl.adminAccent, co: cl.white, bd: "none" }, danger: { bg: cl.danger, co: cl.white, bd: "none" } };
  const st = styles[variant];
  return (
    <button onClick={onClick} disabled={disabled || loading} style={{ width: "100%", padding: "14px", border: st.bd, borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer", fontFamily: font, transition: "all .2s", background: disabled ? "#E0DDD6" : st.bg, color: disabled ? cl.textD : st.co }}>
      {loading ? <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid currentColor", borderTopColor: "transparent", borderRadius: "50%", animation: "spin .7s linear infinite" }} />査定中…最新相場を検索しています</span> : children}
    </button>
  );
}
function Box({ title, sub, children, type }) {
  const bgMap = { admin: cl.adminBg, staff: cl.staffBg, default: cl.surface };
  const bdMap = { admin: cl.adminBorder, staff: cl.staffBorder, default: cl.border };
  const coMap = { admin: cl.adminAccent, staff: cl.staffAccent, default: cl.accent };
  const k = type || "default";
  return (
    <div style={{ background: bgMap[k], borderRadius: 10, border: "1px solid " + bdMap[k], padding: 18, marginBottom: 14 }}>
      {title && <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700, color: coMap[k], fontFamily: font }}>{title}</p>}
      {sub && <p style={{ margin: "0 0 14px", fontSize: 11, color: cl.textD, fontFamily: font }}>{sub}</p>}
      {children}
    </div>
  );
}
function Row({ label, value, borderColor }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid " + (borderColor || cl.border) }}>
      <span style={{ fontSize: 12, color: cl.textD, fontFamily: font }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: cl.text, fontFamily: font, textAlign: "right", maxWidth: "60%", wordBreak: "break-word" }}>{value}</span>
    </div>
  );
}
function ImageUploader({ images, setImages }) {
  const fileRef = useRef();
  const handleFiles = files => { Array.from(files).forEach(file => { if (!file.type.startsWith("image/")) return; const r = new FileReader(); r.onload = () => setImages(prev => [...prev, { preview: r.result, base64: r.result.split(",")[1] }]); r.readAsDataURL(file); }); };
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: cl.textM, marginBottom: 8, fontFamily: font }}>商品写真（任意・複数可）</label>
      <div onClick={() => fileRef.current?.click()} onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = cl.accent }} onDragLeave={e => e.currentTarget.style.borderColor = cl.border} onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = cl.border; handleFiles(e.dataTransfer.files) }} style={{ border: "2px dashed " + cl.border, borderRadius: 8, padding: "22px 16px", textAlign: "center", cursor: "pointer", background: cl.surfAlt }}>
        <div style={{ width: 34, height: 34, margin: "0 auto 6px", borderRadius: "50%", border: "2px solid " + cl.textD, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: cl.textD, fontWeight: 300 }}>+</div>
        <p style={{ margin: 0, fontSize: 12, color: cl.textM, fontFamily: font }}>タップして写真を選択</p>
        <p style={{ margin: "3px 0 0", fontSize: 11, color: cl.textD, fontFamily: font }}>写真からAIが自動判別します</p>
        <input ref={fileRef} type="file" accept="image/*" multiple capture="environment" style={{ display: "none" }} onChange={e => handleFiles(e.target.files)} />
      </div>
      {images.length > 0 && <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>{images.map((img, i) => (
        <div key={i} style={{ position: "relative", width: 68, height: 68, borderRadius: 6, overflow: "hidden", border: "1px solid " + cl.border }}>
          <img src={img.preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <button onClick={() => setImages(p => p.filter((_, j) => j !== i))} style={{ position: "absolute", top: 2, right: 2, width: 20, height: 20, borderRadius: "50%", background: "rgba(0,0,0,.55)", color: "#fff", border: "none", fontSize: 11, cursor: "pointer", lineHeight: "18px", padding: 0 }}>x</button>
        </div>
      ))}</div>}
    </div>
  );
}

function StaffExplanation({ result }) {
  const [copied, setCopied] = useState(false);
  const text = result.customer_explanation || "";
  const copy = () => { navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }).catch(() => {}); };
  if (!text) return null;
  return (
    <Box title="お客様への説明文" sub="このままお客様にお伝えいただける内容です" type="staff">
      <div style={{ padding: "14px 16px", background: cl.white, borderRadius: 8, border: "1px solid " + cl.staffBorder, marginBottom: 10 }}>
        <p style={{ margin: 0, fontSize: 14, color: cl.text, lineHeight: 2, fontFamily: font }}>{text}</p>
      </div>
      <button onClick={copy} style={{ background: "none", border: "1px solid " + cl.staffBorder, borderRadius: 6, padding: "8px 16px", fontSize: 12, fontWeight: 600, color: cl.staffAccent, cursor: "pointer", fontFamily: font, width: "100%" }}>
        {copied ? "コピーしました" : "説明文をコピー"}
      </button>
    </Box>
  );
}

function AdminSalesIntel({ result }) {
  const channels = result.sales_channels || [];
  return (
    <>
      <Box title="仕入れ上限" type="admin">
        <p style={{ fontSize: 24, fontWeight: 800, color: cl.adminAccent, margin: "0 0 8px", fontFamily: font }}>{fmt(result.purchase_upper_limit)}</p>
        <p style={{ margin: 0, fontSize: 12, color: cl.text, lineHeight: 1.7, fontFamily: font }}>{result.purchase_limit_reason}</p>
      </Box>
      <Box title="在庫戦略" type="admin">
        <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
          {[["在庫向き","#E3EFF8",cl.adminAccent],["即売り向き","#FFF3E0","#E67E22"]].map(([l,bg,co])=>(
            <div key={l} style={{ flex:1, padding:"10px 14px", borderRadius:6, textAlign:"center", background:result.inventory_strategy===l?bg:cl.surfAlt, border:"2px solid "+(result.inventory_strategy===l?co:"transparent") }}>
              <p style={{ margin:0, fontSize:13, fontWeight:700, color:result.inventory_strategy===l?co:cl.textD, fontFamily:font }}>{l}</p>
            </div>
          ))}
        </div>
        <p style={{ margin:0, fontSize:12, color:cl.text, lineHeight:1.7, fontFamily:font }}>{result.inventory_reason}</p>
      </Box>
      <Box title="売却先候補" sub="販路優先順位順" type="admin">
        {channels.sort((a,b)=>a.priority-b.priority).map((ch,i)=>(
          <div key={i} style={{ padding:14, background:cl.white, borderRadius:8, border:"1px solid "+cl.adminBorder, marginBottom:i<channels.length-1?10:0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
              <span style={{ width:22, height:22, borderRadius:"50%", background:cl.adminAccent, color:cl.white, display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, fontFamily:font, flexShrink:0 }}>{ch.priority}</span>
              <div>
                <p style={{ margin:0, fontSize:14, fontWeight:700, color:cl.text, fontFamily:font }}>{ch.name}</p>
                <p style={{ margin:"2px 0 0", fontSize:11, color:cl.textD, fontFamily:font }}>{ch.type}</p>
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
              <div style={{ padding:"6px 10px", background:cl.adminBg, borderRadius:4 }}>
                <p style={{ margin:0, fontSize:10, color:cl.textD, fontFamily:font }}>想定売価</p>
                <p style={{ margin:"2px 0 0", fontSize:14, fontWeight:700, color:cl.text, fontFamily:font }}>{fmt(ch.expected_sell_price)}</p>
              </div>
              <div style={{ padding:"6px 10px", background:ch.gross_profit>0?"#F0F7F2":"#FDF5F4", borderRadius:4 }}>
                <p style={{ margin:0, fontSize:10, color:cl.textD, fontFamily:font }}>粗利見込み</p>
                <p style={{ margin:"2px 0 0", fontSize:14, fontWeight:700, color:ch.gross_profit>0?cl.success:cl.danger, fontFamily:font }}>{fmt(ch.gross_profit)}</p>
                <p style={{ margin:"1px 0 0", fontSize:10, color:cl.textD, fontFamily:font }}>{ch.gross_profit_rate}</p>
              </div>
            </div>
            <p style={{ margin:0, fontSize:12, color:cl.textM, lineHeight:1.6, fontFamily:font }}>{ch.reason}</p>
          </div>
        ))}
      </Box>
      {result.recommended_channel && <Box type="admin"><p style={{ margin:"0 0 4px", fontSize:11, color:cl.adminAccent, fontWeight:600, fontFamily:font }}>推奨売却先</p><p style={{ margin:0, fontSize:16, fontWeight:800, color:cl.text, fontFamily:font }}>{result.recommended_channel}</p></Box>}
      {result.admin_memo && <Box title="管理者メモ" type="admin"><p style={{ margin:0, fontSize:13, color:cl.text, lineHeight:1.8, fontFamily:font }}>{result.admin_memo}</p></Box>}
    </>
  );
}

function PriceResult({ result }) {
  const trend = t => t === "上昇" ? "↑ 上昇傾向" : t === "下降" ? "↓ 下降傾向" : "→ 安定";
  return (
    <>
      {result.identified_item && <div style={{ marginBottom:14, padding:12, background:cl.accentBg, borderRadius:8 }}><p style={{ margin:0, fontSize:11, color:cl.textM, fontFamily:font }}>識別された商品</p><p style={{ margin:"4px 0 0", fontSize:14, fontWeight:600, color:cl.text, fontFamily:font }}>{result.identified_item}</p></div>}
      <div style={{ background:cl.surface, borderRadius:10, border:"1px solid "+cl.accentL, padding:20, marginBottom:14 }}>
        <div style={{ textAlign:"center", marginBottom:18 }}>
          <p style={{ fontSize:11, color:cl.textD, margin:"0 0 2px", fontFamily:font }}>推奨買取価格</p>
          <p style={{ fontSize:32, fontWeight:800, color:cl.accent, margin:0, fontFamily:font }}>{fmt(result.recommended_price)}</p>
        </div>
        <div style={{ marginBottom:18 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
            <span style={{ fontSize:11, color:cl.textD, fontFamily:font }}>下限</span>
            <span style={{ fontSize:11, color:cl.textD, fontFamily:font }}>上限</span>
          </div>
          <div style={{ position:"relative", height:8, background:"#E8E4DC", borderRadius:4 }}>
            <div style={{ position:"absolute", left:0, top:0, height:"100%", width:"100%", background:"linear-gradient(90deg, "+cl.danger+"40, "+cl.success+"40)", borderRadius:4 }} />
            {result.max_price > result.min_price && (()=>{ const pos=((result.recommended_price-result.min_price)/(result.max_price-result.min_price))*100; return <div style={{ position:"absolute", top:-3, left:Math.min(Math.max(pos,5),95)+"%", transform:"translateX(-50%)", width:14, height:14, background:cl.accent, borderRadius:"50%", border:"2px solid "+cl.white, boxShadow:"0 1px 3px rgba(0,0,0,.2)" }} />; })()}
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:6 }}>
            <span style={{ fontSize:14, fontWeight:700, color:cl.text, fontFamily:font }}>{fmt(result.min_price)}</span>
            <span style={{ fontSize:14, fontWeight:700, color:cl.text, fontFamily:font }}>{fmt(result.max_price)}</span>
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:16 }}>
          <div style={{ padding:"10px 12px", background:"#FDF5F4", borderRadius:6, borderLeft:"3px solid "+cl.danger }}>
            <p style={{ margin:0, fontSize:10, fontWeight:700, color:cl.danger, fontFamily:font }}>下限の理由</p>
            <p style={{ margin:"4px 0 0", fontSize:11, color:cl.text, lineHeight:1.6, fontFamily:font }}>{result.min_price_reason||"—"}</p>
          </div>
          <div style={{ padding:"10px 12px", background:"#F2F8F4", borderRadius:6, borderLeft:"3px solid "+cl.success }}>
            <p style={{ margin:0, fontSize:10, fontWeight:700, color:cl.success, fontFamily:font }}>上限の理由</p>
            <p style={{ margin:"4px 0 0", fontSize:11, color:cl.text, lineHeight:1.6, fontFamily:font }}>{result.max_price_reason||"—"}</p>
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
          {[["販売相場",fmt(result.market_price),cl.text],["トレンド",trend(result.market_trend),cl.text],["信頼度",result.confidence,result.confidence==="高"?cl.success:result.confidence==="低"?cl.danger:cl.accent]].map(([l,v,co])=>(
            <div key={l} style={{ padding:"8px 10px", background:cl.surfAlt, borderRadius:6 }}>
              <p style={{ fontSize:10, color:cl.textD, margin:0, fontFamily:font }}>{l}</p>
              <p style={{ fontSize:13, fontWeight:600, color:co, margin:"2px 0 0", fontFamily:font }}>{v}</p>
            </div>
          ))}
        </div>
      </div>
      <Box title="査定根拠">
        <p style={{ fontSize:13, color:cl.text, margin:"0 0 10px", lineHeight:1.8, fontFamily:font }}>{result.reasoning}</p>
        {result.trend_reason && <div style={{ padding:"8px 12px", background:cl.surfAlt, borderRadius:6, marginBottom:10 }}><p style={{ margin:0, fontSize:11, color:cl.textM, fontFamily:font }}><span style={{ fontWeight:600 }}>相場動向: </span>{result.trend_reason}</p></div>}
        {result.price_factors?.map((f,i)=><div key={i} style={{ padding:"7px 12px", background:cl.surfAlt, borderRadius:5, marginBottom:5, fontSize:12, color:cl.textM, fontFamily:font, borderLeft:"3px solid "+cl.accentL }}>{f}</div>)}
      </Box>
    </>
  );
}

function AppraisalTab({ role, onSaveToLegal }) {
  const [cat, setCat] = useState("");
  const [brand, setBrand] = useState("");
  const [name, setName] = useState("");
  const [cond, setCond] = useState("");
  const [acc, setAcc] = useState("");
  const [notes, setNotes] = useState("");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const hasImg = images.length > 0;
  const hasTxt = cat && brand && name && cond;
  const ok = hasImg || hasTxt;
  const run = async () => {
    setLoading(true); setError(""); setResult(null);
    try {
      const data = await callAppraisal({ category: CATEGORIES.find(x=>x.id===cat)?.label||cat, brand, name, condition: CONDITIONS.find(x=>x.id===cond)?.label||cond, accessories: acc, notes, imageBase64: images[0]?.base64||null });
      setResult(data);
    } catch { setError("査定に失敗しました。もう一度お試しください。"); }
    setLoading(false);
  };
  return (
    <div style={{ padding:16 }}>
      <Box title="商品写真" sub="写真だけでも査定できます"><ImageUploader images={images} setImages={setImages} /></Box>
      <Box title="カテゴリ" sub="写真がある場合は省略可">
        <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:6 }}>
          {CATEGORIES.map(x=>(
            <button key={x.id} onClick={()=>setCat(x.id)} style={{ padding:"9px 10px", textAlign:"left", cursor:"pointer", background:cat===x.id?cl.accentBg:cl.surfAlt, border:"1px solid "+(cat===x.id?cl.accentL:cl.border), borderRadius:6, transition:"all .15s" }}>
              <span style={{ fontSize:12, fontWeight:600, color:cat===x.id?cl.accent:cl.text, display:"block", fontFamily:font }}>{x.label}</span>
              <span style={{ fontSize:10, color:cl.textD, fontFamily:font }}>{x.examples}</span>
            </button>
          ))}
        </div>
      </Box>
      <Box title="商品詳細" sub="わかる範囲で入力">
        <Input label="ブランド / メーカー" value={brand} onChange={setBrand} placeholder="例: ルイヴィトン" />
        <Input label="商品名 / 型番" value={name} onChange={setName} placeholder="例: ネヴァーフル MM M40995" />
        <Select label="状態" value={cond} onChange={setCond} options={CONDITIONS.map(x=>({value:x.id,label:x.label+" — "+x.desc}))} />
        <Input label="付属品" value={acc} onChange={setAcc} placeholder="箱, 保証書, ギャランティカード" />
        <Input label="特記事項" value={notes} onChange={setNotes} multiline placeholder="傷の場所、色、サイズ、購入時期など" />
      </Box>
      <Btn onClick={run} disabled={!ok} loading={loading}>{hasImg&&!hasTxt?"写真からAI査定を実行":"AI査定を実行"}</Btn>
      {!ok && <p style={{ fontSize:11, color:cl.textD, textAlign:"center", marginTop:8, fontFamily:font }}>写真を追加するか、カテゴリ等を入力してください</p>}
      {error && <div style={{ marginTop:14, padding:14, background:"#FDF2F0", border:"1px solid #E8C4BF", borderRadius:8 }}><p style={{ color:cl.danger, margin:0, fontSize:13, fontFamily:font }}>{error}</p></div>}
      {result && (
        <div style={{ marginTop:20 }}>
          <p style={{ fontSize:14, fontWeight:700, color:cl.accent, marginBottom:12, fontFamily:font }}>査定結果</p>
          <PriceResult result={result} />
          {role==="staff" && <StaffExplanation result={result} />}
          {role==="admin" && <AdminSalesIntel result={result} />}
          <div style={{ marginTop:14 }}><Btn onClick={()=>onSaveToLegal({ category:CATEGORIES.find(x=>x.id===cat)?.label||result.identified_item||"", brand:brand||"", itemName:name||result.identified_item||"", condition:CONDITIONS.find(x=>x.id===cond)?.label||"", accessories:acc, notes, result })} variant="secondary">この査定結果を台帳に記録する</Btn></div>
        </div>
      )}
    </div>
  );
}

function LegalTab({ prefill, onSave }) {
  const now = new Date();
  const ds = now.getFullYear()+"-"+String(now.getMonth()+1).padStart(2,"0")+"-"+String(now.getDate()).padStart(2,"0");
  const [form, setForm] = useState({ date:ds, itemCategory:"", itemBrand:"", itemName:"", itemCondition:"", itemFeatures:"", itemAccessories:"", purchasePrice:"", sellerName:"", sellerNameKana:"", sellerDob:"", sellerAddress:"", sellerPhone:"", sellerIdType:"", sellerIdNumber:"", idVerifiedBy:"", idVerifyMethod:"対面（身分証提示）", transactionLocation:"", staffName:"", receiptNumber:"", remarks:"" });
  const u = (k,v) => setForm(p=>({...p,[k]:v}));
  const [saved, setSaved] = useState(false);
  useEffect(()=>{ if(prefill) setForm(p=>({...p, itemCategory:prefill.category||p.itemCategory, itemBrand:prefill.brand||p.itemBrand, itemName:prefill.itemName||p.itemName, itemCondition:prefill.condition||p.itemCondition, itemFeatures:prefill.notes||p.itemFeatures, itemAccessories:prefill.accessories||p.itemAccessories, purchasePrice:prefill.result?.recommended_price?.toString()||p.purchasePrice})) },[prefill]);
  const req = ["date","itemName","purchasePrice","sellerName","sellerAddress","sellerPhone","sellerIdType","sellerIdNumber","idVerifiedBy","staffName"];
  const ok = req.every(f=>form[f]?.trim());
  const save = () => { onSave({...form, id:Date.now().toString(), timestamp:new Date().toISOString()}); setSaved(true); setTimeout(()=>setSaved(false),3000) };
  return (
    <div style={{ padding:16 }}>
      <div style={{ background:cl.accentBg, borderRadius:8, padding:14, marginBottom:16, border:"1px solid "+cl.accentL }}>
        <p style={{ fontSize:12, fontWeight:700, color:cl.accent, margin:"0 0 6px", fontFamily:font }}>古物営業法に基づく記録義務</p>
        <p style={{ fontSize:11, color:cl.textM, margin:0, lineHeight:1.7, fontFamily:font }}>第16条・第17条により、品目・特徴・相手方情報・本人確認方法等を台帳に記録し、3年間保存する義務があります。</p>
      </div>
      <Box title="取引情報"><Input label="取引日" value={form.date} onChange={v=>u("date",v)} type="date" required /><Input label="取引場所" value={form.transactionLocation} onChange={v=>u("transactionLocation",v)} placeholder="東京都新宿区○○ 1-2-3" /><Input label="担当者名" value={form.staffName} onChange={v=>u("staffName",v)} required placeholder="担当者のフルネーム" /><Input label="伝票番号" value={form.receiptNumber} onChange={v=>u("receiptNumber",v)} placeholder="社内管理番号" /></Box>
      <Box title="商品情報"><Input label="品目" value={form.itemCategory} onChange={v=>u("itemCategory",v)} placeholder="時計・宝飾品類" /><Input label="ブランド" value={form.itemBrand} onChange={v=>u("itemBrand",v)} placeholder="ロレックス" /><Input label="商品名 / 型番" value={form.itemName} onChange={v=>u("itemName",v)} required placeholder="デイトナ Ref.116500LN" /><Input label="状態" value={form.itemCondition} onChange={v=>u("itemCondition",v)} placeholder="A 美品" /><Input label="特徴" value={form.itemFeatures} onChange={v=>u("itemFeatures",v)} multiline placeholder="色・素材・シリアル等" /><Input label="付属品" value={form.itemAccessories} onChange={v=>u("itemAccessories",v)} placeholder="箱、保証書" /><Input label="買取金額（円）" value={form.purchasePrice} onChange={v=>u("purchasePrice",v)} type="number" required /></Box>
      <Box title="相手方情報（売主）"><Input label="氏名" value={form.sellerName} onChange={v=>u("sellerName",v)} required placeholder="山田 太郎" /><Input label="フリガナ" value={form.sellerNameKana} onChange={v=>u("sellerNameKana",v)} placeholder="ヤマダ タロウ" /><Input label="生年月日" value={form.sellerDob} onChange={v=>u("sellerDob",v)} type="date" /><Input label="住所" value={form.sellerAddress} onChange={v=>u("sellerAddress",v)} required placeholder="東京都○○区○○ 1-2-3" /><Input label="電話番号" value={form.sellerPhone} onChange={v=>u("sellerPhone",v)} required placeholder="090-XXXX-XXXX" /></Box>
      <Box title="本人確認記録"><Select label="身分証明書の種類" value={form.sellerIdType} onChange={v=>u("sellerIdType",v)} options={ID_TYPES} required /><Input label="身分証番号" value={form.sellerIdNumber} onChange={v=>u("sellerIdNumber",v)} required placeholder="証明書の番号" /><Input label="確認者" value={form.idVerifiedBy} onChange={v=>u("idVerifiedBy",v)} required placeholder="確認した担当者名" /><Select label="確認方法" value={form.idVerifyMethod} onChange={v=>u("idVerifyMethod",v)} options={["対面（身分証提示）","対面（身分証コピー取得）","非対面（身分証画像送付）","非対面（転送不要郵便）"]} /></Box>
      <Box title="備考"><Input label="備考" value={form.remarks} onChange={v=>u("remarks",v)} multiline placeholder="特記事項" /></Box>
      <Btn onClick={save} disabled={!ok}>{saved?"保存しました":"台帳に保存"}</Btn>
      {!ok && <p style={{ fontSize:11, color:cl.danger, textAlign:"center", marginTop:8, fontFamily:font }}>必須項目（*）をすべて入力してください</p>}
    </div>
  );
}

function HistoryTab({ records, role }) {
  const [sel, setSel] = useState(null);
  if (!records.length) return <div style={{ padding:48, textAlign:"center" }}><p style={{ fontSize:14, color:cl.textD, fontFamily:font }}>保存された記録はありません</p></div>;
  if (sel) {
    const r = sel;
    return (
      <div style={{ padding:16 }}>
        <button onClick={()=>setSel(null)} style={{ background:"none", border:"none", color:cl.accent, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:font, marginBottom:14, padding:0 }}>← 一覧に戻る</button>
        <Box title="取引詳細">{[["取引日",r.date],["取引場所",r.transactionLocation],["担当者",r.staffName],["伝票番号",r.receiptNumber]].map(([l,v])=>v?<Row key={l} label={l} value={v}/>:null)}</Box>
        <Box title="商品情報">{[["品目",r.itemCategory],["ブランド",r.itemBrand],["商品名",r.itemName],["状態",r.itemCondition],["付属品",r.itemAccessories],["買取金額",fmt(r.purchasePrice)]].map(([l,v])=>v?<Row key={l} label={l} value={v}/>:null)}</Box>
        {role==="admin"&&<Box title="相手方情報" type="admin">{[["氏名",r.sellerName],["フリガナ",r.sellerNameKana],["生年月日",r.sellerDob],["住所",r.sellerAddress],["電話番号",r.sellerPhone]].map(([l,v])=>v?<Row key={l} label={l} value={v} borderColor={cl.adminBorder}/>:null)}</Box>}
        {role==="admin"&&<Box title="本人確認" type="admin">{[["証明書種類",r.sellerIdType],["証明書番号",r.sellerIdNumber],["確認者",r.idVerifiedBy],["確認方法",r.idVerifyMethod]].map(([l,v])=>v?<Row key={l} label={l} value={v} borderColor={cl.adminBorder}/>:null)}</Box>}
      </div>
    );
  }
  return (
    <div style={{ padding:16 }}>
      <p style={{ fontSize:12, color:cl.textD, margin:"0 0 12px", fontFamily:font }}>{records.length}件の取引記録</p>
      {records.map(r=>(
        <div key={r.id} onClick={()=>setSel(r)} style={{ background:cl.surface, borderRadius:8, border:"1px solid "+cl.border, padding:14, marginBottom:10, cursor:"pointer" }}>
          <div style={{ display:"flex", justifyContent:"space-between" }}>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ fontSize:14, fontWeight:700, color:cl.text, margin:"0 0 3px", fontFamily:font }}>{r.itemBrand} {r.itemName}</p>
              <p style={{ fontSize:11, color:cl.textD, margin:0, fontFamily:font }}>{r.itemCategory} {r.date}</p>
              <p style={{ fontSize:11, color:cl.textD, margin:"2px 0 0", fontFamily:font }}>担当: {r.staffName}</p>
            </div>
            <p style={{ fontSize:15, fontWeight:800, color:cl.accent, margin:0, whiteSpace:"nowrap", fontFamily:font }}>{fmt(r.purchasePrice)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function Dashboard({ records }) {
  const total = records.reduce((s,r)=>s+(Number(r.purchasePrice)||0),0);
  const today = new Date().toISOString().slice(0,10);
  const todayR = records.filter(r=>r.date===today);
  const todayT = todayR.reduce((s,r)=>s+(Number(r.purchasePrice)||0),0);
  return (
    <div style={{ padding:16 }}>
      <p style={{ fontSize:14, fontWeight:700, color:cl.adminAccent, marginBottom:14, fontFamily:font }}>ダッシュボード</p>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
        {[{l:"総取引件数",v:records.length+"件"},{l:"総買取金額",v:fmt(total)},{l:"本日の件数",v:todayR.length+"件"},{l:"本日の買取額",v:fmt(todayT)}].map(({l,v})=>(
          <div key={l} style={{ background:cl.adminBg, borderRadius:8, padding:"12px 14px", border:"1px solid "+cl.adminBorder }}>
            <p style={{ margin:0, fontSize:10, color:cl.adminAccent, fontWeight:600, fontFamily:font }}>{l}</p>
            <p style={{ margin:"4px 0 0", fontSize:18, fontWeight:800, color:cl.text, fontFamily:font }}>{v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function LoginScreen({ onLogin }) {
  const [pin, setPin] = useState("");
  const [role, setRole] = useState(null);
  const [err, setErr] = useState("");
  const ADMIN_PIN = "9999";
  const STAFF_PIN = "1234";
  const go = () => {
    if (role==="admin" && pin===ADMIN_PIN) { onLogin("admin"); return }
    if (role==="staff" && (pin===STAFF_PIN || pin===ADMIN_PIN)) { onLogin("staff"); return }
    setErr("PINが正しくありません"); setTimeout(()=>setErr(""),2000);
  };
  return (
    <div style={{ maxWidth:400, margin:"0 auto", minHeight:"100vh", background:cl.bg, fontFamily:font, display:"flex", flexDirection:"column", justifyContent:"center", padding:24 }}>
      <div style={{ textAlign:"center", marginBottom:36 }}>
        <h1 style={{ fontSize:20, fontWeight:800, color:cl.accent, margin:"0 0 4px", letterSpacing:2 }}>出張買取</h1>
        <p style={{ fontSize:12, color:cl.textD, margin:0 }}>AI査定 ・ 古物台帳記録システム</p>
      </div>
      <Box title="ログイン">
        <p style={{ fontSize:12, color:cl.textM, margin:"0 0 14px", fontFamily:font }}>役割を選択してPINを入力してください</p>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:18 }}>
          {[["admin","管理者","全データ閲覧・管理",cl.adminBg,cl.adminAccent],["staff","スタッフ","査定・台帳入力",cl.accentBg,cl.accent]].map(([id,label,desc,bg,co])=>(
            <button key={id} onClick={()=>setRole(id)} style={{ padding:"16px 12px", background:role===id?bg:cl.surfAlt, border:"2px solid "+(role===id?co:cl.border), borderRadius:8, cursor:"pointer", textAlign:"center" }}>
              <p style={{ margin:0, fontSize:14, fontWeight:700, color:role===id?co:cl.text, fontFamily:font }}>{label}</p>
              <p style={{ margin:"4px 0 0", fontSize:11, color:cl.textD, fontFamily:font }}>{desc}</p>
            </button>
          ))}
        </div>
        {role && <>
          <Input label="PIN" value={pin} onChange={setPin} placeholder="PINを入力" type="password" required />
          <Btn onClick={go} disabled={pin.length<4} variant={role==="admin"?"admin":"primary"}>ログイン</Btn>
          {err && <p style={{ fontSize:12, color:cl.danger, textAlign:"center", marginTop:8, fontFamily:font }}>{err}</p>}
        </>}
      </Box>
    </div>
  );
}

export default function Home() {
  const [role, setRole] = useState(null);
  const [tab, setTab] = useState("appraisal");
  const [records, setRecords] = useState([]);
  const [prefill, setPrefill] = useState(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); setRecords(loadRecords()); }, []);
  const addRecord = rec => { const up = [rec,...records]; setRecords(up); saveRecords(up); };
  if (!mounted) return null;
  if (!role) return <LoginScreen onLogin={setRole} />;
  const isAdmin = role === "admin";
  const tabs = isAdmin ? [{id:"dashboard",label:"ダッシュボード"},{id:"appraisal",label:"査定"},{id:"legal",label:"台帳記録"},{id:"history",label:"履歴"}] : [{id:"appraisal",label:"査定"},{id:"legal",label:"台帳記録"},{id:"history",label:"履歴"}];
  return (
    <div style={{ maxWidth:480, margin:"0 auto", minHeight:"100vh", background:cl.bg, fontFamily:font }}>
      <style>{"@keyframes spin{to{transform:rotate(360deg)}}*{box-sizing:border-box}input,select,textarea{font-family:'Noto Sans JP',sans-serif}input::-webkit-outer-spin-button,input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}"}</style>
      <div style={{ padding:"14px 16px", background:isAdmin?cl.adminBg:cl.surface, borderBottom:"1px solid "+(isAdmin?cl.adminBorder:cl.border), display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <h1 style={{ margin:0, fontSize:16, fontWeight:800, color:isAdmin?cl.adminAccent:cl.accent, letterSpacing:1.5 }}>出張買取</h1>
          <p style={{ margin:"1px 0 0", fontSize:10, color:cl.textD }}>AI査定 ・ 古物台帳記録</p>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:10, fontWeight:700, padding:"4px 10px", borderRadius:4, fontFamily:font, background:isAdmin?cl.adminAccent:cl.accent, color:cl.white }}>{isAdmin?"管理者":"スタッフ"}</span>
          <button onClick={()=>{setRole(null);setTab("appraisal")}} style={{ background:"none", border:"1px solid "+cl.border, borderRadius:4, padding:"4px 10px", fontSize:10, color:cl.textD, cursor:"pointer", fontFamily:font }}>ログアウト</button>
        </div>
      </div>
      <div style={{ display:"flex", background:cl.surface, borderBottom:"1px solid "+cl.border, position:"sticky", top:0, zIndex:100 }}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{ flex:1, padding:"11px 0", background:"none", border:"none", whiteSpace:"nowrap", borderBottom:tab===t.id?"2px solid "+cl.accent:"2px solid transparent", color:tab===t.id?cl.accent:cl.textD, fontSize:12, fontWeight:tab===t.id?700:400, cursor:"pointer", fontFamily:font }}>
            {t.label}
          </button>
        ))}
      </div>
      {tab==="dashboard"&&isAdmin&&<Dashboard records={records}/>}
      {tab==="appraisal"&&<AppraisalTab role={role} onSaveToLegal={d=>{setPrefill(d);setTab("legal")}}/>}
      {tab==="legal"&&<LegalTab prefill={prefill} onSave={addRecord}/>}
      {tab==="history"&&<HistoryTab records={records} role={role}/>}
      <div style={{ padding:"14px 16px 34px", textAlign:"center" }}>
        <p style={{ fontSize:10, color:cl.textD, margin:0, lineHeight:1.7 }}>AI査定はウェブ検索による参考価格です。最終判断は担当者に委ねられます。</p>
      </div>
    </div>
  );
}
