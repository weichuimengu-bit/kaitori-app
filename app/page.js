"use client";
import { useState, useEffect, useRef } from "react";

const GAS_URL = process.env.NEXT_PUBLIC_GAS_URL || "";

async function gasPost(body) {
  if (!GAS_URL) throw new Error("GAS URLが未設定です（NEXT_PUBLIC_GAS_URL）");
  const res = await fetch(GAS_URL, { method: "POST", headers: { "Content-Type": "text/plain" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error("通信エラー: " + res.status);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || "処理に失敗しました");
  return data;
}

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
    photoGuide: ["正面全体","背面","底面（角スレ）","内部（シリアル）","金具アップ","ダメージ箇所"],
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
    photoGuide: ["文字盤正面","ケース側面","裏蓋（シリアル）","ブレスレット全体","バックル","ダメージ箇所"],
    authGuide: { summary: "「重量感」「リューズの操作感」「秒針の動き」を確認。本物はずっしり重い。", checks: ["重量感 — 偽物は明らかに軽い","秒針 — 機械式はスイープ運針。カチカチはクォーツか偽物","リューズ — 滑らかな抵抗感があるか","文字盤印刷 — ルーペで確認。にじみがないか","仕上げ — ヘアラインとポリッシュの境目が明確か"] },
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
    photoGuide: ["全体写真","宝石アップ","刻印アップ","鑑定書","裏側","ダメージ箇所"],
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
    photoGuide: ["正面全体","背面","ブランドタグ","ケアラベル","ダメージ箇所"],
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
    photoGuide: ["正面（画面点灯）","背面","側面","傷アップ","シリアル表示画面","付属品"],
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
    photoGuide: ["全体正面","裏面・底面","銘・落款アップ","共箱","ダメージ箇所"],
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
    photoGuide: ["全体正面","背面","ヘッド（シリアル）","傷","フレット状態"],
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
    photoGuide: ["ボトル全体","ラベルアップ","液面レベル","キャップ","背面ラベル","箱"],
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
    photoGuide: ["表面全体","裏面","刻印アップ","鑑定書","ダメージ箇所"],
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
    photoGuide: ["全体写真","ロゴ/刻印","ダメージ箇所","箱"],
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

const cl = {bg:"#F4F2ED",surface:"#FFFFFF",surfAlt:"#F9F8F5",border:"#E3DED5",bFocus:"#8B7355",accent:"#5C4D33",accentL:"#8B7355",accentBg:"#EDE8DD",text:"#2A2215",textM:"#5C5040",textD:"#9B9080",danger:"#B14A3F",success:"#3E7A56",white:"#FFFFFF",staffBg:"#F0F7F2",staffAccent:"#3E7A56",staffBorder:"#C2DCC9",authBg:"#FFF8F0",authAccent:"#C67030",authBorder:"#E8CBA8"};
const font="'Noto Sans JP',sans-serif";
const fmt=n=>(!n&&n!==0)?"---":"¥"+Number(n).toLocaleString();

// ─── AI Appraisal ───────────────────────────────────────────────────
async function callAppraisal({category,fields,condition,imageBase64}){
  const content=[];
  if(imageBase64) content.push({type:"image",source:{type:"base64",media_type:"image/jpeg",data:imageBase64}});
  const ft=Object.entries(fields).filter(([,v])=>v).map(([k,v])=>"- "+k+": "+v).join("\n");
  let p="あなたはプロの買取査定士です。ウェブ検索で最新の中古相場を必ず調べてから査定してください。\n";
  if(imageBase64) p+="添付画像も参考にしてください。\n\n";
  p+="カテゴリ: "+(category||"不明")+"\n状態: "+(condition||"不明")+"\n\n商品詳細:\n"+(ft||"画像から判断");
  p+='\n\nJSONのみ回答:\n{"identified_item":"商品名","min_price":0,"max_price":0,"recommended_price":0,"market_price":0,"reasoning":"根拠","min_price_reason":"下限理由","max_price_reason":"上限理由","price_factors":["要因"],"market_trend":"上昇/安定/下降","trend_reason":"理由","confidence":"高/中/低","customer_explanation":"お客様向け説明3-4文"}';
  content.push({type:"text",text:p});
  const res=await fetch("/api/appraise",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({content})});
  const data=await res.json();
  if(data.error) throw new Error(typeof data.error==="string"?data.error:JSON.stringify(data.error));
  if(!data.content) throw new Error("応答が空です");
  const txt=(data.content||[]).filter(b=>b.type==="text").map(b=>b.text).join("");
  if(!txt) throw new Error("テキストが空です");
  const m=txt.replace(/```json|```/g,"").trim().match(/\{[\s\S]*\}/);
  if(!m) throw new Error("解析失敗");
  return JSON.parse(m[0]);
}

// ─── UI Components ──────────────────────────────────────────────────
function Input({label,value,onChange,placeholder,required,multiline,type="text"}){
  const s={width:"100%",boxSizing:"border-box",padding:"11px 14px",background:cl.surfAlt,border:"1px solid "+cl.border,borderRadius:6,color:cl.text,fontSize:14,fontFamily:font,outline:"none"};
  return(<div style={{marginBottom:14}}><label style={{display:"block",fontSize:12,fontWeight:600,color:cl.textM,marginBottom:5,fontFamily:font}}>{label}{required&&<span style={{color:cl.danger,marginLeft:3}}>*</span>}</label>{multiline?<textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={3} style={{...s,resize:"vertical"}} onFocus={e=>e.target.style.borderColor=cl.bFocus} onBlur={e=>e.target.style.borderColor=cl.border}/>:<input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={s} onFocus={e=>e.target.style.borderColor=cl.bFocus} onBlur={e=>e.target.style.borderColor=cl.border}/>}</div>);
}
function Sel({label,value,onChange,options,required}){
  return(<div style={{marginBottom:14}}><label style={{display:"block",fontSize:12,fontWeight:600,color:cl.textM,marginBottom:5,fontFamily:font}}>{label}{required&&<span style={{color:cl.danger,marginLeft:3}}>*</span>}</label><select value={value} onChange={e=>onChange(e.target.value)} style={{width:"100%",padding:"11px 14px",background:cl.surfAlt,border:"1px solid "+cl.border,borderRadius:6,color:cl.text,fontSize:14,fontFamily:font,outline:"none",boxSizing:"border-box"}}><option value="">選択してください</option>{options.map(o=><option key={o.value||o} value={o.value||o}>{o.label||o}</option>)}</select></div>);
}
function Btn({onClick,children,disabled,loading,variant="primary"}){
  const st={primary:{bg:cl.accent,co:cl.white,bd:"none"},secondary:{bg:cl.surface,co:cl.text,bd:"1px solid "+cl.border}}[variant]||{bg:cl.accent,co:cl.white,bd:"none"};
  return(<button onClick={onClick} disabled={disabled||loading} style={{width:"100%",padding:"14px",border:st.bd,borderRadius:8,fontSize:14,fontWeight:700,cursor:disabled?"not-allowed":"pointer",fontFamily:font,background:disabled?"#E0DDD6":st.bg,color:disabled?cl.textD:st.co}}>{loading?<span style={{display:"inline-flex",alignItems:"center",gap:8}}><span style={{display:"inline-block",width:14,height:14,border:"2px solid currentColor",borderTopColor:"transparent",borderRadius:"50%",animation:"spin .7s linear infinite"}}/>処理中...</span>:children}</button>);
}
function Box({title,sub,children,type}){
  const bg={staff:cl.staffBg,auth:cl.authBg}[type]||cl.surface;
  const bd={staff:cl.staffBorder,auth:cl.authBorder}[type]||cl.border;
  const co={staff:cl.staffAccent,auth:cl.authAccent}[type]||cl.accent;
  return(<div style={{background:bg,borderRadius:10,border:"1px solid "+bd,padding:18,marginBottom:14}}>{title&&<p style={{margin:"0 0 4px",fontSize:13,fontWeight:700,color:co,fontFamily:font}}>{title}</p>}{sub&&<p style={{margin:"0 0 14px",fontSize:11,color:cl.textD,fontFamily:font}}>{sub}</p>}{children}</div>);
}
function ImageUploader({images,setImages,photoGuide}){
  const ref=useRef();
  const add=files=>{Array.from(files).forEach(f=>{if(!f.type.startsWith("image/"))return;const r=new FileReader();r.onload=()=>setImages(p=>[...p,{preview:r.result,base64:r.result.split(",")[1]}]);r.readAsDataURL(f)})};
  return(<div style={{marginBottom:14}}><div onClick={()=>ref.current?.click()} style={{border:"2px dashed "+cl.border,borderRadius:8,padding:"18px 16px",textAlign:"center",cursor:"pointer",background:cl.surfAlt}}><div style={{width:32,height:32,margin:"0 auto 4px",borderRadius:"50%",border:"2px solid "+cl.textD,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,color:cl.textD}}>+</div><p style={{margin:0,fontSize:12,color:cl.textM,fontFamily:font}}>写真を追加</p><input ref={ref} type="file" accept="image/*" multiple capture="environment" style={{display:"none"}} onChange={e=>add(e.target.files)}/></div>{images.length>0&&<div style={{display:"flex",gap:8,marginTop:8,flexWrap:"wrap"}}>{images.map((img,i)=>(<div key={i} style={{position:"relative",width:64,height:64,borderRadius:6,overflow:"hidden",border:"1px solid "+cl.border}}><img src={img.preview} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/><button onClick={()=>setImages(p=>p.filter((_,j)=>j!==i))} style={{position:"absolute",top:1,right:1,width:18,height:18,borderRadius:"50%",background:"rgba(0,0,0,.5)",color:"#fff",border:"none",fontSize:10,cursor:"pointer",lineHeight:"16px",padding:0}}>x</button></div>))}</div>}{photoGuide&&<div style={{marginTop:10,padding:"10px 12px",background:"#F8F6F1",borderRadius:6,border:"1px solid "+cl.border}}><p style={{margin:"0 0 6px",fontSize:11,fontWeight:600,color:cl.accent,fontFamily:font}}>撮影ガイド</p><p style={{margin:0,fontSize:11,color:cl.textM,fontFamily:font,lineHeight:1.8}}>{photoGuide.join(" / ")}</p></div>}</div>);
}
function AuthGuide({authGuide}){if(!authGuide)return null;return(<Box title="真贋確認ガイド" type="auth"><p style={{margin:"0 0 12px",fontSize:13,color:cl.text,lineHeight:1.9,fontFamily:font}}>{authGuide.summary}</p><div style={{borderTop:"1px solid "+cl.authBorder,paddingTop:12}}>{authGuide.checks.map((c,i)=>{const [t,...r]=c.split(" — ");return(<div key={i} style={{padding:"10px 12px",background:cl.white,borderRadius:6,marginBottom:6,border:"1px solid "+cl.authBorder}}><p style={{margin:0,fontSize:12,fontWeight:700,color:cl.text,fontFamily:font}}>{t}</p>{r.length>0&&<p style={{margin:"4px 0 0",fontSize:12,color:cl.textM,lineHeight:1.7,fontFamily:font}}>{r.join(" — ")}</p>}</div>)})}</div></Box>)}

// ─── Price Result ───────────────────────────────────────────────────
function PriceResult({result}){
  const trend=t=>t==="上昇"?"↑ 上昇":t==="下降"?"↓ 下降":"→ 安定";
  return(<>
    {result.identified_item&&<div style={{marginBottom:14,padding:12,background:cl.accentBg,borderRadius:8}}><p style={{margin:0,fontSize:11,color:cl.textM,fontFamily:font}}>識別商品</p><p style={{margin:"4px 0 0",fontSize:14,fontWeight:600,color:cl.text,fontFamily:font}}>{result.identified_item}</p></div>}
    <div style={{background:cl.surface,borderRadius:10,border:"1px solid "+cl.accentL,padding:20,marginBottom:14}}>
      <div style={{textAlign:"center",marginBottom:16}}><p style={{fontSize:11,color:cl.textD,margin:"0 0 2px",fontFamily:font}}>推奨買取価格</p><p style={{fontSize:30,fontWeight:800,color:cl.accent,margin:0,fontFamily:font}}>{fmt(result.recommended_price)}</p></div>
      <div style={{marginBottom:16}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:11,color:cl.textD,fontFamily:font}}>下限</span><span style={{fontSize:11,color:cl.textD,fontFamily:font}}>上限</span></div><div style={{position:"relative",height:8,background:"#E8E4DC",borderRadius:4}}><div style={{position:"absolute",left:0,top:0,height:"100%",width:"100%",background:"linear-gradient(90deg,"+cl.danger+"40,"+cl.success+"40)",borderRadius:4}}/>{result.max_price>result.min_price&&(()=>{const p=((result.recommended_price-result.min_price)/(result.max_price-result.min_price))*100;return<div style={{position:"absolute",top:-3,left:Math.min(Math.max(p,5),95)+"%",transform:"translateX(-50%)",width:14,height:14,background:cl.accent,borderRadius:"50%",border:"2px solid "+cl.white,boxShadow:"0 1px 3px rgba(0,0,0,.2)"}}/>})()}</div><div style={{display:"flex",justifyContent:"space-between",marginTop:4}}><span style={{fontSize:13,fontWeight:700,color:cl.text,fontFamily:font}}>{fmt(result.min_price)}</span><span style={{fontSize:13,fontWeight:700,color:cl.text,fontFamily:font}}>{fmt(result.max_price)}</span></div></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}><div style={{padding:"8px 10px",background:"#FDF5F4",borderRadius:6,borderLeft:"3px solid "+cl.danger}}><p style={{margin:0,fontSize:10,fontWeight:600,color:cl.danger,fontFamily:font}}>下限の理由</p><p style={{margin:"3px 0 0",fontSize:11,color:cl.text,lineHeight:1.5,fontFamily:font}}>{result.min_price_reason||"—"}</p></div><div style={{padding:"8px 10px",background:"#F2F8F4",borderRadius:6,borderLeft:"3px solid "+cl.success}}><p style={{margin:0,fontSize:10,fontWeight:600,color:cl.success,fontFamily:font}}>上限の理由</p><p style={{margin:"3px 0 0",fontSize:11,color:cl.text,lineHeight:1.5,fontFamily:font}}>{result.max_price_reason||"—"}</p></div></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>{[["相場",fmt(result.market_price),cl.text],["動向",trend(result.market_trend),cl.text],["信頼度",result.confidence,result.confidence==="高"?cl.success:result.confidence==="低"?cl.danger:cl.accent]].map(([l,v,co])=>(<div key={l} style={{padding:"6px 8px",background:cl.surfAlt,borderRadius:6}}><p style={{fontSize:10,color:cl.textD,margin:0,fontFamily:font}}>{l}</p><p style={{fontSize:12,fontWeight:600,color:co,margin:"2px 0 0",fontFamily:font}}>{v}</p></div>))}</div>
    </div>
    <Box title="査定根拠"><p style={{fontSize:12,color:cl.text,margin:0,lineHeight:1.8,fontFamily:font}}>{result.reasoning}</p>{result.price_factors?.map((f,i)=><div key={i} style={{padding:"6px 10px",background:cl.surfAlt,borderRadius:4,marginTop:6,fontSize:11,color:cl.textM,fontFamily:font,borderLeft:"3px solid "+cl.accentL}}>{f}</div>)}</Box>
    {result.customer_explanation&&<Box title="お客様への説明文" type="staff"><p style={{margin:0,fontSize:13,color:cl.text,lineHeight:2,fontFamily:font}}>{result.customer_explanation}</p></Box>}
  </>);
}

// ─── Appraisal Tab ──────────────────────────────────────────────────
function AppraisalTab({staffName}){
  const [catId,setCatId]=useState("");const [fields,setFields]=useState({});const [cond,setCond]=useState("");const [images,setImages]=useState([]);const [loading,setLoading]=useState(false);const [result,setResult]=useState(null);const [error,setError]=useState("");
  const config=CATEGORY_CONFIG[catId];const hasImg=images.length>0;const hasReq=config?config.fields.filter(f=>f.required).every(f=>fields[f.key]?.trim()):false;const ok=catId&&(hasImg||hasReq);

  const run=async()=>{
    setLoading(true);setError("");setResult(null);
    try{
      const data=await callAppraisal({category:config?.label||"",fields,condition:CONDITIONS.find(x=>x.id===cond)?.label||cond,imageBase64:images[0]?.base64||null});
      setResult(data);
      // 査定ログをGASに保存
      try{await gasPost({action:"saveAppraisalLog",customerName:"",itemName:data.identified_item||fields.name||"",priceEstimate:fmt(data.recommended_price),staffName:staffName||"",remarks:config?.label||""})}catch(e){}
    }catch(e){setError(e.message||"査定失敗")}
    setLoading(false);
  };

  return(<div style={{padding:16}}>
    <Box title="カテゴリを選択"><div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:6}}>{Object.entries(CATEGORY_CONFIG).map(([id,cfg])=>(<button key={id} onClick={()=>{setCatId(id);setFields({});setResult(null);setError("")}} style={{padding:"9px 10px",textAlign:"left",cursor:"pointer",background:catId===id?cl.accentBg:cl.surfAlt,border:"1px solid "+(catId===id?cl.accentL:cl.border),borderRadius:6}}><span style={{fontSize:12,fontWeight:600,color:catId===id?cl.accent:cl.text,display:"block",fontFamily:font}}>{cfg.label}</span><span style={{fontSize:10,color:cl.textD,fontFamily:font}}>{cfg.examples}</span></button>))}</div></Box>
    {catId&&config&&<>
      {config.authGuide&&<AuthGuide authGuide={config.authGuide}/>}
      <Box title="商品写真"><ImageUploader images={images} setImages={setImages} photoGuide={config.photoGuide}/></Box>
      <Box title={config.label+"の詳細"} sub="わかる範囲で">{config.fields.map(f=>(<Input key={f.key} label={f.label} value={fields[f.key]||""} onChange={v=>setFields(p=>({...p,[f.key]:v}))} placeholder={f.placeholder} required={f.required} multiline={f.multiline}/>))}<Sel label="状態ランク" value={cond} onChange={setCond} options={CONDITIONS.map(x=>({value:x.id,label:x.label+" — "+x.desc}))}/></Box>
      <Btn onClick={run} disabled={!ok} loading={loading}>AI査定を実行</Btn>
    </>}
    {error&&<div style={{marginTop:14,padding:14,background:"#FDF2F0",border:"1px solid #E8C4BF",borderRadius:8}}><p style={{color:cl.danger,margin:0,fontSize:12,fontFamily:font,wordBreak:"break-word"}}>{error}</p></div>}
    {result&&<div style={{marginTop:20}}><PriceResult result={result}/></div>}
  </div>);
}

// ─── Ledger Tab (GAS save) ──────────────────────────────────────────
function LegalTab({staffName}){
  const now=new Date();const ds=now.getFullYear()+"-"+String(now.getMonth()+1).padStart(2,"0")+"-"+String(now.getDate()).padStart(2,"0");
  const emptyItem={itemName:"",purchasePrice:"",remarks:""};
  const [visit,setVisit]=useState({date:ds,staffName:staffName||"",sellerName:"",sellerPhone:"",sellerAddress:"",sellerIdType:"",sellerIdNumber:"",idVerifiedBy:staffName||""});
  const [items,setItems]=useState([{...emptyItem}]);
  const [saving,setSaving]=useState(false);const [saved,setSaved]=useState("");const [error,setError]=useState("");
  const uv=(k,v)=>setVisit(p=>({...p,[k]:v}));
  const ui=(idx,k,v)=>setItems(p=>p.map((it,i)=>i===idx?{...it,[k]:v}:it));

  const visReq=["sellerName","sellerPhone","sellerAddress","sellerIdType","sellerIdNumber","staffName"];
  const ok=visReq.every(f=>visit[f]?.trim())&&items.every(it=>it.itemName?.trim()&&it.purchasePrice?.trim());

  const save=async()=>{
    setSaving(true);setError("");setSaved("");
    try{
      const data=await gasPost({action:"saveLedger",sellerName:visit.sellerName,sellerPhone:visit.sellerPhone,sellerAddress:visit.sellerAddress,staffName:visit.staffName,items:items.map(it=>({itemName:it.itemName,purchasePrice:it.purchasePrice,remarks:"身分証:"+visit.sellerIdType+" "+visit.sellerIdNumber+" / 確認者:"+visit.idVerifiedBy+(it.remarks?" / "+it.remarks:"")}))});
      setSaved("保存完了（案件ID: "+data.caseId+"）");
    }catch(e){setError(e.message||"保存に失敗しました")}
    setSaving(false);
  };

  return(<div style={{padding:16}}>
    <div style={{background:cl.accentBg,borderRadius:8,padding:14,marginBottom:16,border:"1px solid "+cl.accentL}}><p style={{fontSize:12,fontWeight:700,color:cl.accent,margin:"0 0 6px",fontFamily:font}}>古物営業法に基づく記録義務</p><p style={{fontSize:11,color:cl.textM,margin:0,lineHeight:1.7,fontFamily:font}}>第16条・第17条により記録・3年間保存義務があります。</p></div>
    <Box title="訪問情報"><Input label="取引日" value={visit.date} onChange={v=>uv("date",v)} type="date" required/><Input label="担当者" value={visit.staffName} onChange={v=>uv("staffName",v)} required placeholder="担当者名"/></Box>
    <Box title="売主情報"><Input label="氏名" value={visit.sellerName} onChange={v=>uv("sellerName",v)} required placeholder="山田 太郎"/><Input label="住所" value={visit.sellerAddress} onChange={v=>uv("sellerAddress",v)} required placeholder="東京都○○区○○"/><Input label="電話番号" value={visit.sellerPhone} onChange={v=>uv("sellerPhone",v)} required placeholder="090-XXXX-XXXX"/></Box>
    <Box title="本人確認"><Sel label="身分証の種類" value={visit.sellerIdType} onChange={v=>uv("sellerIdType",v)} options={ID_TYPES} required/><Input label="身分証番号" value={visit.sellerIdNumber} onChange={v=>uv("sellerIdNumber",v)} required placeholder="番号"/><Input label="確認者" value={visit.idVerifiedBy} onChange={v=>uv("idVerifiedBy",v)} required placeholder="確認者名"/></Box>

    {items.map((it,idx)=>(<Box key={idx} title={"商品 "+(idx+1)}>
      <Input label="商品名" value={it.itemName} onChange={v=>ui(idx,"itemName",v)} required placeholder="ロレックス デイトナ"/>
      <Input label="買取金額（円）" value={it.purchasePrice} onChange={v=>ui(idx,"purchasePrice",v)} type="number" required/>
      <Input label="備考" value={it.remarks} onChange={v=>ui(idx,"remarks",v)} placeholder="品目、状態、付属品など"/>
      {items.length>1&&<button onClick={()=>setItems(p=>p.filter((_,i)=>i!==idx))} style={{background:"none",border:"1px solid "+cl.danger,borderRadius:6,padding:"6px 12px",fontSize:11,color:cl.danger,cursor:"pointer",fontFamily:font,width:"100%"}}>この商品を削除</button>}
    </Box>))}
    <div style={{marginBottom:14}}><Btn onClick={()=>setItems(p=>[...p,{...emptyItem}])} variant="secondary">+ 商品を追加</Btn></div>

    <Btn onClick={save} disabled={!ok} loading={saving}>スプレッドシートに保存（{items.length}件）</Btn>
    {saved&&<div style={{marginTop:10,padding:12,background:"#F0F7F2",border:"1px solid "+cl.staffBorder,borderRadius:8}}><p style={{margin:0,fontSize:13,fontWeight:600,color:cl.success,fontFamily:font}}>{saved}</p></div>}
    {error&&<div style={{marginTop:10,padding:12,background:"#FDF2F0",border:"1px solid #E8C4BF",borderRadius:8}}><p style={{margin:0,fontSize:12,color:cl.danger,fontFamily:font}}>{error}</p></div>}
    {!ok&&<p style={{fontSize:11,color:cl.danger,textAlign:"center",marginTop:8,fontFamily:font}}>必須項目（*）と各商品の商品名・金額を入力してください</p>}
  </div>);
}

// ─── Login ──────────────────────────────────────────────────────────
function LoginScreen({onLogin}){
  const [staffId,setStaffId]=useState("");const [password,setPassword]=useState("");const [loading,setLoading]=useState(false);const [err,setErr]=useState("");
  const go=async()=>{
    if(!staffId.trim()||!password.trim()){setErr("IDとパスワードを入力してください");return}
    if(!/^\d{4}$/.test(password)){setErr("パスワードは4桁の数字です");return}
    setLoading(true);setErr("");
    try{const data=await gasPost({action:"login",staffId:staffId.trim(),password:password.trim()});onLogin({staffId:data.staffId,staffName:data.staffName})}catch(e){setErr(e.message||"ログイン失敗")}
    setLoading(false);
  };
  return(<div style={{maxWidth:400,margin:"0 auto",minHeight:"100vh",background:cl.bg,fontFamily:font,display:"flex",flexDirection:"column",justifyContent:"center",padding:24}}>
    <div style={{textAlign:"center",marginBottom:36}}><h1 style={{fontSize:20,fontWeight:800,color:cl.accent,margin:"0 0 4px",letterSpacing:2}}>出張買取</h1><p style={{fontSize:12,color:cl.textD,margin:0}}>AI査定 ・ 古物台帳記録</p></div>
    <Box title="スタッフログイン">
      <Input label="スタッフID" value={staffId} onChange={setStaffId} placeholder="例: staff001" required/>
      <Input label="パスワード（4桁）" value={password} onChange={setPassword} placeholder="4桁の数字" type="password" required/>
      <Btn onClick={go} disabled={!staffId.trim()||!password.trim()} loading={loading}>ログイン</Btn>
      {err&&<p style={{fontSize:12,color:cl.danger,textAlign:"center",marginTop:10,fontFamily:font}}>{err}</p>}
    </Box>
  </div>);
}

// ─── Main App ───────────────────────────────────────────────────────
export default function Home(){
  const [user,setUser]=useState(null);const [tab,setTab]=useState("appraisal");const [mounted,setMounted]=useState(false);
  useEffect(()=>{setMounted(true)},[]);
  if(!mounted)return null;
  if(!user)return<LoginScreen onLogin={setUser}/>;
  const tabs=[{id:"appraisal",label:"査定"},{id:"legal",label:"台帳記録"}];
  return(<div style={{maxWidth:480,margin:"0 auto",minHeight:"100vh",background:cl.bg,fontFamily:font}}>
    <style>{"@keyframes spin{to{transform:rotate(360deg)}}*{box-sizing:border-box}input,select,textarea{font-family:'Noto Sans JP',sans-serif}input::-webkit-outer-spin-button,input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}"}</style>
    <div style={{padding:"14px 16px",background:cl.surface,borderBottom:"1px solid "+cl.border,display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><h1 style={{margin:0,fontSize:16,fontWeight:800,color:cl.accent,letterSpacing:1.5}}>出張買取</h1><p style={{margin:"1px 0 0",fontSize:10,color:cl.textD}}>{user.staffName}さん</p></div><button onClick={()=>setUser(null)} style={{background:"none",border:"1px solid "+cl.border,borderRadius:4,padding:"4px 10px",fontSize:10,color:cl.textD,cursor:"pointer",fontFamily:font}}>ログアウト</button></div>
    <div style={{display:"flex",background:cl.surface,borderBottom:"1px solid "+cl.border,position:"sticky",top:0,zIndex:100}}>{tabs.map(t=>(<button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:"11px 0",background:"none",border:"none",borderBottom:tab===t.id?"2px solid "+cl.accent:"2px solid transparent",color:tab===t.id?cl.accent:cl.textD,fontSize:12,fontWeight:tab===t.id?700:400,cursor:"pointer",fontFamily:font}}>{t.label}</button>))}</div>
    {tab==="appraisal"&&<AppraisalTab staffName={user.staffName}/>}
    {tab==="legal"&&<LegalTab staffName={user.staffName}/>}
   
