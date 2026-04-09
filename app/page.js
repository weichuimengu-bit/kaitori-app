"use client";
import { useState, useEffect, useRef } from "react";

// ─── Category Config (practical field-level auth checks, not brand-specific) ─
const CATEGORY_CONFIG = {
  brand_bag: {
    label: "ブランドバッグ", examples: "ルイヴィトン, シャネル, エルメス", needsAuth: true,
    fields: [
      { key: "brand", label: "ブランド", placeholder: "例: ルイヴィトン", required: true },
      { key: "name", label: "商品名 / 型番", placeholder: "例: ネヴァーフル MM M40995", required: true },
      { key: "material", label: "素材", placeholder: "例: モノグラム・キャンバス" },
      { key: "color", label: "カラー", placeholder: "例: ブラウン" },
      { key: "serial", label: "シリアル / 製造番号", placeholder: "内部タグに記載" },
      { key: "accessories", label: "付属品", placeholder: "箱, 保存袋, ストラップ, レシート" },
      { key: "condition_detail", label: "状態の詳細", placeholder: "角スレ、持ち手の黒ずみなど", multiline: true },
    ],
    photoGuide: ["正面全体","背面","底面（角スレ確認）","内部（シリアル番号）","金具アップ","ダメージ箇所"],
    authGuide: {
      summary: "出張先では「素材の質感」「縫製の精度」「金具の刻印」の3点を重点的に確認します。ルーペ（10倍）があれば刻印の確認精度が上がります。手触りと匂いは現場でしか確認できない重要な判断材料です。",
      checks: [
        "素材の質感と匂い — 本革特有のしっとりした手触りと匂いがあるか。合皮はビニール臭がする",
        "縫製（ステッチ） — 糸の間隔が均一か、ほつれや歪みがないか。斜めに傾いていたら要注意",
        "金具の刻印 — ファスナー引き手やバックルにブランド名の刻印があるか。文字の彫りが浅い・にじんでいるものは偽物の可能性",
        "内部タグ / シリアル — 製造番号の書体やフォーマットがそのブランドの正規品と一致するか",
        "ロゴの印字 — プリントや型押しの精度。にじみ・ズレ・太さの不均一がないか",
      ],
    },
  },
  brand_watch: {
    label: "腕時計", examples: "ロレックス, オメガ, カルティエ", needsAuth: true,
    fields: [
      { key: "brand", label: "ブランド", placeholder: "例: ロレックス", required: true },
      { key: "name", label: "モデル名 / Ref番号", placeholder: "例: デイトナ Ref.116500LN", required: true },
      { key: "movement", label: "ムーブメント", placeholder: "自動巻き / クォーツ" },
      { key: "case_material", label: "ケース素材", placeholder: "例: SS、18KYG" },
      { key: "dial_color", label: "文字盤", placeholder: "例: ブラック" },
      { key: "serial", label: "シリアル", placeholder: "ケース裏/ラグ間" },
      { key: "year", label: "購入時期", placeholder: "例: 2020年" },
      { key: "accuracy", label: "精度・動作", placeholder: "例: 日差+3秒" },
      { key: "accessories", label: "付属品", placeholder: "箱, 保証書, コマ" },
      { key: "condition_detail", label: "状態の詳細", placeholder: "ガラス傷、ベゼル、ブレスのヨレなど", multiline: true },
    ],
    photoGuide: ["文字盤正面","ケース側面（リューズ側）","裏蓋（シリアル）","ブレスレット全体","バックル","ダメージ箇所"],
    authGuide: {
      summary: "出張先では「重量感」「リューズの操作感」「秒針の動き」を確認します。本物は持った瞬間にずっしりとした重みがあります。可能であれば裏蓋を開けずにムーブメントの音を耳で確認してください。",
      checks: [
        "重量感 — 手に持ったときのずっしり感。偽物は明らかに軽い",
        "秒針の動き — 高級機械式はスイープ運針（滑らかに動く）。カチカチ動くのはクォーツか偽物",
        "リューズの操作感 — 巻き上げ時に滑らかな抵抗感があるか。引っかかりやガタつきは要注意",
        "文字盤の印刷 — ルーペで確認。文字のエッジがシャープか、にじみがないか",
        "ケース・ブレスの仕上げ — ヘアラインとポリッシュの境目がはっきりしているか",
      ],
    },
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
    photoGuide: ["全体写真","宝石アップ","刻印アップ（K18等）","鑑定書","裏側","ダメージ箇所"],
    authGuide: {
      summary: "出張先では「刻印の確認」「磁石テスト」「ルーペでの石の確認」が基本です。携帯用の磁石とルーペは必須ツールです。鑑定書がある場合は記載内容と現物の一致を確認してください。",
      checks: [
        "刻印の確認 — K18, Pt900等の打刻がはっきりしているか。刻印がないものは要注意",
        "磁石テスト — 金・プラチナは磁石に反応しない。反応する場合は偽物またはメッキ",
        "ルーペで石の確認 — 天然ダイヤは内部にインクルージョン（内包物）が見える。完全に透明すぎるものはCZ（キュービックジルコニア）の可能性",
        "鑑定書との照合 — カラット数、カラー、クラリティが鑑定書の記載と一致するか",
        "地金の色味 — K18は濃い金色、K14はやや薄い。プラチナは白銀色で重みがある",
      ],
    },
  },
  brand_clothes: {
    label: "ブランド衣類", examples: "グッチ, プラダ, バーバリー", needsAuth: true,
    fields: [
      { key: "brand", label: "ブランド", placeholder: "例: グッチ", required: true },
      { key: "name", label: "アイテム名", placeholder: "例: GGマーモント ジャケット", required: true },
      { key: "item_type", label: "種類", placeholder: "ジャケット / スニーカー等" },
      { key: "size", label: "サイズ", placeholder: "例: 48, M" },
      { key: "color", label: "カラー", placeholder: "例: ブラック" },
      { key: "season", label: "シーズン", placeholder: "例: 2023AW" },
      { key: "accessories", label: "付属品", placeholder: "タグ, ガーメントバッグ" },
      { key: "condition_detail", label: "状態の詳細", placeholder: "毛羽立ち、シミなど", multiline: true },
    ],
    photoGuide: ["正面全体","背面","ブランドタグ","ケアラベル","ダメージ箇所","靴はソール裏"],
    authGuide: {
      summary: "出張先では「タグの品質」「縫製の仕上げ」「素材の質感」を確認します。ブランド品はタグの書体・縫い付けが非常に丁寧です。ケアラベルの印字品質も重要な判断材料です。",
      checks: [
        "ブランドタグ — 書体が正規品と一致するか、縫い付けが丁寧か",
        "ケアラベル — 洗濯表示の印字がクリアか。にじみや誤字は偽物の兆候",
        "縫製の仕上げ — ステッチが均一か、裏地の始末が丁寧か",
        "素材の質感 — 表示素材と実際の手触りが一致するか",
        "ボタン・ジッパー — ブランド刻印があるか、動きが滑らかか",
      ],
    },
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
    photoGuide: ["正面（画面点灯）","背面","側面","画面の傷アップ","シリアル表示画面","付属品"],
  },
  antique: {
    label: "骨董品・美術品", examples: "掛軸, 茶道具, 陶磁器", needsAuth: true,
    fields: [
      { key: "name", label: "品名", placeholder: "例: 備前焼 花入", required: true },
      { key: "artist", label: "作家名 / 窯元", placeholder: "例: 金重陶陽" },
      { key: "era", label: "時代", placeholder: "例: 江戸時代" },
      { key: "signature", label: "銘 / 落款", placeholder: "あり / なし" },
      { key: "cert", label: "鑑定書 / 箱書", placeholder: "共箱あり / なし" },
      { key: "accessories", label: "付属品", placeholder: "共箱, 仕覆" },
      { key: "condition_detail", label: "状態の詳細", placeholder: "ヒビ、欠けなど", multiline: true },
    ],
    photoGuide: ["全体正面","裏面・底面","銘・落款アップ","共箱の箱書き","ダメージ箇所","鑑定書"],
    authGuide: {
      summary: "骨董品は専門知識が必要な分野です。出張先では「銘の確認」「経年変化の自然さ」「共箱との一致」を確認し、判断が難しい場合は持ち帰り鑑定を提案してください。",
      checks: [
        "銘・落款 — 作家の既知の作風・書体と一致するか",
        "経年変化 — 自然な古色・使用痕があるか。人工的に古く見せた形跡はないか",
        "共箱 — 箱書きの筆跡と作品が矛盾しないか",
        "技法 — その時代・窯元に合った技法で作られているか",
      ],
    },
  },
  musical: {
    label: "楽器", examples: "ギター, ピアノ, バイオリン",
    fields: [
      { key: "brand", label: "メーカー", placeholder: "例: Gibson", required: true },
      { key: "name", label: "モデル名", placeholder: "例: Les Paul Standard", required: true },
      { key: "year", label: "製造年", placeholder: "例: 2019年" },
      { key: "serial", label: "シリアル", placeholder: "ヘッド裏に記載" },
      { key: "operation", label: "動作状況", placeholder: "ネック反り、フレット残等" },
      { key: "accessories", label: "付属品", placeholder: "ケース, ストラップ" },
      { key: "condition_detail", label: "状態の詳細", placeholder: "打痕、塗装剥がれなど", multiline: true },
    ],
    photoGuide: ["全体正面","背面","ヘッド（シリアル）","ボディの傷","フレット状態"],
  },
  liquor: {
    label: "お酒", examples: "ウイスキー, ワイン, 日本酒",
    fields: [
      { key: "brand", label: "銘柄", placeholder: "例: 山崎25年", required: true },
      { key: "name", label: "種類", placeholder: "例: シングルモルト", required: true },
      { key: "volume", label: "容量", placeholder: "例: 700ml" },
      { key: "storage", label: "保管状況", placeholder: "冷暗所 / 常温" },
      { key: "level", label: "液面レベル", placeholder: "減りなし / 減りあり" },
      { key: "accessories", label: "付属品", placeholder: "箱, 冊子" },
      { key: "condition_detail", label: "状態の詳細", placeholder: "ラベル汚れ、キャップ状態", multiline: true },
    ],
    photoGuide: ["ボトル全体（ラベル正面）","ラベルアップ","液面レベル","キャップ部分","背面ラベル","箱"],
  },
  gold_metal: {
    label: "金・貴金属", examples: "金地金, 金貨, プラチナ", needsAuth: true,
    fields: [
      { key: "name", label: "品名", placeholder: "例: 金地金 100g", required: true },
      { key: "metal_type", label: "種類 / 純度", placeholder: "例: K24純金" },
      { key: "weight", label: "重量", placeholder: "例: 100g", required: true },
      { key: "maker", label: "製造元", placeholder: "例: 田中貴金属" },
      { key: "serial", label: "シリアル", placeholder: "刻印" },
      { key: "cert", label: "鑑定書", placeholder: "あり / なし" },
      { key: "accessories", label: "付属品", placeholder: "ケース, 保証書" },
      { key: "condition_detail", label: "状態の詳細", placeholder: "傷、変色など", multiline: true },
    ],
    photoGuide: ["表面全体","裏面","刻印アップ（純度・重量）","鑑定書","ダメージ箇所"],
    authGuide: {
      summary: "出張先では「磁石テスト」「重量の実測」「刻印の確認」が必須です。携帯用の精密はかりと磁石は必ず持参してください。比重計があればさらに精度が上がります。",
      checks: [
        "磁石テスト — 純金・プラチナは磁石に一切反応しない。少しでも反応したら偽物",
        "重量の実測 — 携帯はかりで計測し、刻印の重量と一致するか確認",
        "刻印の鮮明さ — 正規品は刻印が深くシャープ。浅い・にじんでいるものは要注意",
        "色味の確認 — 純金は深い黄金色。メッキは表面が均一すぎる",
        "製造元の照合 — シリアル番号を製造元に確認できる場合は照合する",
      ],
    },
  },
  other: {
    label: "その他", examples: "フィギュア, 食器 等",
    fields: [
      { key: "brand", label: "ブランド / メーカー", placeholder: "例: バカラ" },
      { key: "name", label: "商品名", placeholder: "例: ロックグラス", required: true },
      { key: "size", label: "サイズ", placeholder: "例: 高さ20cm" },
      { key: "accessories", label: "付属品", placeholder: "箱, 説明書" },
      { key: "condition_detail", label: "状態の詳細", placeholder: "傷、欠けなど", multiline: true },
    ],
    photoGuide: ["全体写真","ロゴ/刻印","ダメージ箇所","箱・付属品"],
  },
};

const CONDITIONS = [
  { id: "S", label: "S 新品同様", desc: "未使用・タグ付き" },
  { id: "A", label: "A 美品", desc: "使用感ほぼなし" },
  { id: "B", label: "B 良好", desc: "多少の使用感あり" },
  { id: "C", label: "C やや難あり", desc: "傷・汚れあり" },
  { id: "D", label: "D 難あり", desc: "大きな傷・破損あり" },
];
const ID_TYPES = ["運転免許証","マイナンバーカード","パスポート","住民基本台帳カード","健康保険証","在留カード","特別永住者証明書"];

const cl = {bg:"#F4F2ED",surface:"#FFFFFF",surfAlt:"#F9F8F5",border:"#E3DED5",bFocus:"#8B7355",accent:"#5C4D33",accentL:"#8B7355",accentBg:"#EDE8DD",text:"#2A2215",textM:"#5C5040",textD:"#9B9080",danger:"#B14A3F",success:"#3E7A56",white:"#FFFFFF",adminBg:"#EBF0F7",adminAccent:"#3D5A80",adminBorder:"#C6D4E3",staffBg:"#F0F7F2",staffAccent:"#3E7A56",staffBorder:"#C2DCC9",authBg:"#FFF8F0",authAccent:"#C67030",authBorder:"#E8CBA8"};
const font="'Noto Sans JP',sans-serif";
const fmt=n=>(!n&&n!==0)?"---":"¥"+Number(n).toLocaleString();

async function callAppraisal({category,fields,condition,imageBase64}){
  const content=[];
  if(imageBase64) content.push({type:"image",source:{type:"base64",media_type:"image/jpeg",data:imageBase64}});
  const fieldText=Object.entries(fields).filter(([,v])=>v).map(([k,v])=>"- "+k+": "+v).join("\n");
  let p="あなたはプロの買取査定士です。ウェブ検索で最新の中古相場を必ず調べてから査定してください。\n";
  if(imageBase64) p+="添付画像も参考にしてください。\n\n";
  p+="カテゴリ: "+(category||"不明")+"\n状態: "+(condition||"不明")+"\n\n商品詳細:\n"+(fieldText||"画像から判断");
  p+='\n\n以下のJSONのみ回答。他の文字は不要:\n{"identified_item":"商品名","min_price":0,"max_price":0,"recommended_price":0,"market_price":0,"reasoning":"査定根拠","min_price_reason":"下限理由","max_price_reason":"上限理由","price_factors":["要因"],"market_trend":"上昇/安定/下降","trend_reason":"理由","confidence":"高/中/低","sales_channels":[{"name":"業者名","type":"種別","expected_sell_price":0,"gross_profit":0,"gross_profit_rate":"0%","priority":1,"reason":"理由"}],"purchase_upper_limit":0,"purchase_limit_reason":"根拠","inventory_strategy":"在庫向き/即売り向き","inventory_reason":"理由","recommended_channel":"推奨先","admin_memo":"メモ","customer_explanation":"お客様向け3-4文"}';
  content.push({type:"text",text:p});
  const res=await fetch("/api/appraise",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({content})});
  const data=await res.json();
  if(data.error) throw new Error(typeof data.error==="string"?data.error:JSON.stringify(data.error));
  if(!data.content) throw new Error("応答が空です");
  const txt=(data.content||[]).filter(b=>b.type==="text").map(b=>b.text).join("");
  if(!txt) throw new Error("テキストが空です。再試行してください");
  const m=txt.replace(/```json|```/g,"").trim().match(/\{[\s\S]*\}/);
  if(!m) throw new Error("解析失敗。再試行してください");
  return JSON.parse(m[0]);
}

function loadRecords(){try{return JSON.parse(localStorage.getItem("kaitori-records")||"[]")}catch{return[]}}
function saveRecords(r){try{localStorage.setItem("kaitori-records",JSON.stringify(r))}catch{}}

// ─── UI Components ──────────────────────────────────────────────────
function Input({label,value,onChange,placeholder,required,multiline,type="text"}){
  const s={width:"100%",boxSizing:"border-box",padding:"11px 14px",background:cl.surfAlt,border:"1px solid "+cl.border,borderRadius:6,color:cl.text,fontSize:14,fontFamily:font,outline:"none"};
  return(<div style={{marginBottom:14}}><label style={{display:"block",fontSize:12,fontWeight:600,color:cl.textM,marginBottom:5,fontFamily:font}}>{label}{required&&<span style={{color:cl.danger,marginLeft:3}}>*</span>}</label>{multiline?<textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={3} style={{...s,resize:"vertical"}} onFocus={e=>e.target.style.borderColor=cl.bFocus} onBlur={e=>e.target.style.borderColor=cl.border}/>:<input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={s} onFocus={e=>e.target.style.borderColor=cl.bFocus} onBlur={e=>e.target.style.borderColor=cl.border}/>}</div>);
}
function Sel({label,value,onChange,options,required}){
  return(<div style={{marginBottom:14}}><label style={{display:"block",fontSize:12,fontWeight:600,color:cl.textM,marginBottom:5,fontFamily:font}}>{label}{required&&<span style={{color:cl.danger,marginLeft:3}}>*</span>}</label><select value={value} onChange={e=>onChange(e.target.value)} style={{width:"100%",padding:"11px 14px",background:cl.surfAlt,border:"1px solid "+cl.border,borderRadius:6,color:cl.text,fontSize:14,fontFamily:font,outline:"none",boxSizing:"border-box"}}><option value="">選択してください</option>{options.map(o=><option key={o.value||o} value={o.value||o}>{o.label||o}</option>)}</select></div>);
}
function Btn({onClick,children,disabled,loading,variant="primary"}){
  const st={primary:{bg:cl.accent,co:cl.white,bd:"none"},secondary:{bg:cl.surface,co:cl.text,bd:"1px solid "+cl.border},admin:{bg:cl.adminAccent,co:cl.white,bd:"none"},danger:{bg:cl.danger,co:cl.white,bd:"none"}}[variant]||{bg:cl.accent,co:cl.white,bd:"none"};
  return(<button onClick={onClick} disabled={disabled||loading} style={{width:"100%",padding:"14px",border:st.bd,borderRadius:8,fontSize:14,fontWeight:700,cursor:disabled?"not-allowed":"pointer",fontFamily:font,background:disabled?"#E0DDD6":st.bg,color:disabled?cl.textD:st.co}}>{loading?<span style={{display:"inline-flex",alignItems:"center",gap:8}}><span style={{display:"inline-block",width:14,height:14,border:"2px solid currentColor",borderTopColor:"transparent",borderRadius:"50%",animation:"spin .7s linear infinite"}}/>査定中…</span>:children}</button>);
}
function Box({title,sub,children,type}){
  const bg={admin:cl.adminBg,staff:cl.staffBg,auth:cl.authBg}[type]||cl.surface;
  const bd={admin:cl.adminBorder,staff:cl.staffBorder,auth:cl.authBorder}[type]||cl.border;
  const co={admin:cl.adminAccent,staff:cl.staffAccent,auth:cl.authAccent}[type]||cl.accent;
  return(<div style={{background:bg,borderRadius:10,border:"1px solid "+bd,padding:18,marginBottom:14}}>{title&&<p style={{margin:"0 0 4px",fontSize:13,fontWeight:700,color:co,fontFamily:font}}>{title}</p>}{sub&&<p style={{margin:"0 0 14px",fontSize:11,color:cl.textD,fontFamily:font}}>{sub}</p>}{children}</div>);
}
function Row({label,value,bc}){return value?(<div style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid "+(bc||cl.border)}}><span style={{fontSize:12,color:cl.textD,fontFamily:font}}>{label}</span><span style={{fontSize:12,fontWeight:600,color:cl.text,fontFamily:font,textAlign:"right",maxWidth:"60%",wordBreak:"break-word"}}>{value}</span></div>):null}
function ImageUploader({images,setImages,photoGuide}){
  const ref=useRef();
  const add=files=>{Array.from(files).forEach(f=>{if(!f.type.startsWith("image/"))return;const r=new FileReader();r.onload=()=>setImages(p=>[...p,{preview:r.result,base64:r.result.split(",")[1]}]);r.readAsDataURL(f)})};
  return(<div style={{marginBottom:14}}><div onClick={()=>ref.current?.click()} style={{border:"2px dashed "+cl.border,borderRadius:8,padding:"18px 16px",textAlign:"center",cursor:"pointer",background:cl.surfAlt}}><div style={{width:32,height:32,margin:"0 auto 4px",borderRadius:"50%",border:"2px solid "+cl.textD,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,color:cl.textD}}>+</div><p style={{margin:0,fontSize:12,color:cl.textM,fontFamily:font}}>写真を追加</p><input ref={ref} type="file" accept="image/*" multiple capture="environment" style={{display:"none"}} onChange={e=>add(e.target.files)}/></div>{images.length>0&&<div style={{display:"flex",gap:8,marginTop:8,flexWrap:"wrap"}}>{images.map((img,i)=>(<div key={i} style={{position:"relative",width:64,height:64,borderRadius:6,overflow:"hidden",border:"1px solid "+cl.border}}><img src={img.preview} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/><button onClick={()=>setImages(p=>p.filter((_,j)=>j!==i))} style={{position:"absolute",top:1,right:1,width:18,height:18,borderRadius:"50%",background:"rgba(0,0,0,.5)",color:"#fff",border:"none",fontSize:10,cursor:"pointer",lineHeight:"16px",padding:0}}>x</button></div>))}</div>}{photoGuide&&<div style={{marginTop:10,padding:"10px 12px",background:"#F8F6F1",borderRadius:6,border:"1px solid "+cl.border}}><p style={{margin:"0 0 6px",fontSize:11,fontWeight:600,color:cl.accent,fontFamily:font}}>撮影ガイド</p><p style={{margin:0,fontSize:11,color:cl.textM,fontFamily:font,lineHeight:1.8}}>{photoGuide.join(" / ")}</p></div>}</div>);
}

// ─── Auth Guide (text-based, practical) ─────────────────────────────
function AuthGuide({authGuide}){
  if(!authGuide) return null;
  return(
    <Box title="真贋確認ガイド" type="auth">
      <p style={{margin:"0 0 12px",fontSize:13,color:cl.text,lineHeight:1.9,fontFamily:font}}>{authGuide.summary}</p>
      <div style={{borderTop:"1px solid "+cl.authBorder,paddingTop:12}}>
        <p style={{margin:"0 0 8px",fontSize:11,fontWeight:700,color:cl.authAccent,fontFamily:font}}>確認ポイント</p>
        {authGuide.checks.map((c,i)=>{
          const [title,...rest]=c.split(" — ");
          return(<div key={i} style={{padding:"10px 12px",background:cl.white,borderRadius:6,marginBottom:6,border:"1px solid "+cl.authBorder}}>
            <p style={{margin:0,fontSize:12,fontWeight:700,color:cl.text,fontFamily:font}}>{title}</p>
            {rest.length>0&&<p style={{margin:"4px 0 0",fontSize:12,color:cl.textM,lineHeight:1.7,fontFamily:font}}>{rest.join(" — ")}</p>}
          </div>);
        })}
      </div>
    </Box>
  );
}

// ─── Price & Results ────────────────────────────────────────────────
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
  </>);
}

function StaffExplanation({result}){
  const [copied,setCopied]=useState(false);const text=result.customer_explanation||"";if(!text)return null;
  return(<Box title="お客様への説明文" type="staff"><div style={{padding:"12px 14px",background:cl.white,borderRadius:8,border:"1px solid "+cl.staffBorder,marginBottom:8}}><p style={{margin:0,fontSize:13,color:cl.text,lineHeight:2,fontFamily:font}}>{text}</p></div><button onClick={()=>{navigator.clipboard.writeText(text).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000)})}} style={{background:"none",border:"1px solid "+cl.staffBorder,borderRadius:6,padding:"8px 14px",fontSize:12,fontWeight:600,color:cl.staffAccent,cursor:"pointer",fontFamily:font,width:"100%"}}>{copied?"コピーしました":"説明文をコピー"}</button></Box>);
}

function AdminSalesIntel({result}){
  const ch=result.sales_channels||[];
  return(<>
    <Box title="仕入れ上限" type="admin"><p style={{fontSize:22,fontWeight:800,color:cl.adminAccent,margin:"0 0 6px",fontFamily:font}}>{fmt(result.purchase_upper_limit)}</p><p style={{margin:0,fontSize:12,color:cl.text,lineHeight:1.6,fontFamily:font}}>{result.purchase_limit_reason}</p></Box>
    <Box title="在庫判断" type="admin"><div style={{display:"flex",gap:8,marginBottom:8}}>{[["在庫向き","#E3EFF8",cl.adminAccent],["即売り向き","#FFF3E0","#E67E22"]].map(([l,bg,co])=>(<div key={l} style={{flex:1,padding:"8px 12px",borderRadius:6,textAlign:"center",background:result.inventory_strategy===l?bg:cl.surfAlt,border:"2px solid "+(result.inventory_strategy===l?co:"transparent")}}><p style={{margin:0,fontSize:12,fontWeight:700,color:result.inventory_strategy===l?co:cl.textD,fontFamily:font}}>{l}</p></div>))}</div><p style={{margin:0,fontSize:11,color:cl.text,lineHeight:1.6,fontFamily:font}}>{result.inventory_reason}</p></Box>
    <Box title="推奨販売先" type="admin">{ch.sort((a,b)=>a.priority-b.priority).map((c,i)=>(<div key={i} style={{padding:12,background:cl.white,borderRadius:8,border:"1px solid "+cl.adminBorder,marginBottom:i<ch.length-1?8:0}}><div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}><span style={{width:20,height:20,borderRadius:"50%",background:cl.adminAccent,color:cl.white,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,fontFamily:font}}>{c.priority}</span><p style={{margin:0,fontSize:13,fontWeight:700,color:cl.text,fontFamily:font}}>{c.name}<span style={{fontWeight:400,color:cl.textD,fontSize:11,marginLeft:6}}>{c.type}</span></p></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:6}}><div style={{padding:"5px 8px",background:cl.adminBg,borderRadius:4}}><p style={{margin:0,fontSize:10,color:cl.textD,fontFamily:font}}>想定売価</p><p style={{margin:"1px 0 0",fontSize:13,fontWeight:700,color:cl.text,fontFamily:font}}>{fmt(c.expected_sell_price)}</p></div><div style={{padding:"5px 8px",background:c.gross_profit>0?"#F0F7F2":"#FDF5F4",borderRadius:4}}><p style={{margin:0,fontSize:10,color:cl.textD,fontFamily:font}}>粗利</p><p style={{margin:"1px 0 0",fontSize:13,fontWeight:700,color:c.gross_profit>0?cl.success:cl.danger,fontFamily:font}}>{fmt(c.gross_profit)} ({c.gross_profit_rate})</p></div></div><p style={{margin:0,fontSize:11,color:cl.textM,lineHeight:1.5,fontFamily:font}}>{c.reason}</p></div>))}</Box>
    {result.admin_memo&&<Box title="管理者メモ" type="admin"><p style={{margin:0,fontSize:12,color:cl.text,lineHeight:1.8,fontFamily:font}}>{result.admin_memo}</p></Box>}
  </>);
}

// ─── Staff Appraisal Tab ────────────────────────────────────────────
function AppraisalTab({role,onSaveToLegal}){
  const [catId,setCatId]=useState("");const [fields,setFields]=useState({});const [cond,setCond]=useState("");const [images,setImages]=useState([]);const [loading,setLoading]=useState(false);const [result,setResult]=useState(null);const [error,setError]=useState("");
  const config=CATEGORY_CONFIG[catId];const hasImg=images.length>0;const hasReq=config?config.fields.filter(f=>f.required).every(f=>fields[f.key]?.trim()):false;const ok=catId&&(hasImg||hasReq);
  const run=async()=>{setLoading(true);setError("");setResult(null);try{const data=await callAppraisal({category:config?.label||"",fields,condition:CONDITIONS.find(x=>x.id===cond)?.label||cond,imageBase64:images[0]?.base64||null});setResult(data)}catch(e){setError(e.message||"査定失敗")}setLoading(false)};
  return(<div style={{padding:16}}>
    <Box title="カテゴリを選択"><div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:6}}>{Object.entries(CATEGORY_CONFIG).map(([id,cfg])=>(<button key={id} onClick={()=>{setCatId(id);setFields({});setResult(null);setError("")}} style={{padding:"9px 10px",textAlign:"left",cursor:"pointer",background:catId===id?cl.accentBg:cl.surfAlt,border:"1px solid "+(catId===id?cl.accentL:cl.border),borderRadius:6}}><span style={{fontSize:12,fontWeight:600,color:catId===id?cl.accent:cl.text,display:"block",fontFamily:font}}>{cfg.label}</span><span style={{fontSize:10,color:cl.textD,fontFamily:font}}>{cfg.examples}</span></button>))}</div></Box>
    {catId&&config&&<>
      {config.authGuide&&<AuthGuide authGuide={config.authGuide}/>}
      <Box title="商品写真"><ImageUploader images={images} setImages={setImages} photoGuide={config.photoGuide}/></Box>
      <Box title={config.label+"の詳細"} sub="わかる範囲で">{config.fields.map(f=>(<Input key={f.key} label={f.label} value={fields[f.key]||""} onChange={v=>setFields(p=>({...p,[f.key]:v}))} placeholder={f.placeholder} required={f.required} multiline={f.multiline}/>))}<Sel label="状態ランク" value={cond} onChange={setCond} options={CONDITIONS.map(x=>({value:x.id,label:x.label+" — "+x.desc}))}/></Box>
      <Btn onClick={run} disabled={!ok} loading={loading}>AI査定を実行</Btn>
    </>}
    {error&&<div style={{marginTop:14,padding:14,background:"#FDF2F0",border:"1px solid #E8C4BF",borderRadius:8}}><p style={{color:cl.danger,margin:0,fontSize:12,fontFamily:font,wordBreak:"break-word"}}>{error}</p></div>}
    {result&&<div style={{marginTop:20}}>
      <PriceResult result={result}/>
      {role==="staff"&&<StaffExplanation result={result}/>}
      {role==="admin"&&<AdminSalesIntel result={result}/>}
      <div style={{marginTop:12}}><Btn onClick={()=>onSaveToLegal({category:config?.label||"",brand:fields.brand||"",itemName:fields.name||result.identified_item||"",condition:CONDITIONS.find(x=>x.id===cond)?.label||"",accessories:fields.accessories||"",notes:fields.condition_detail||"",result})} variant="secondary">台帳に記録する</Btn></div>
    </div>}
  </div>);
}

// ─── Legal Tab (batch items per visit) ──────────────────────────────
function LegalTab({prefill,onSave}){
  const now=new Date();const ds=now.getFullYear()+"-"+String(now.getMonth()+1).padStart(2,"0")+"-"+String(now.getDate()).padStart(2,"0");
  const emptyItem={itemCategory:"",itemBrand:"",itemName:"",itemCondition:"",itemFeatures:"",itemAccessories:"",purchasePrice:""};
  const [visit,setVisit]=useState({date:ds,transactionLocation:"",staffName:"",sellerName:"",sellerNameKana:"",sellerDob:"",sellerAddress:"",sellerPhone:"",sellerIdType:"",sellerIdNumber:"",idVerifiedBy:"",idVerifyMethod:"対面（身分証提示）",remarks:""});
  const [items,setItems]=useState([{...emptyItem}]);
  const [saved,setSaved]=useState(false);
  const uv=(k,v)=>setVisit(p=>({...p,[k]:v}));
  const ui=(idx,k,v)=>setItems(p=>p.map((it,i)=>i===idx?{...it,[k]:v}:it));
  const addItem=()=>setItems(p=>[...p,{...emptyItem}]);
  const removeItem=idx=>setItems(p=>p.length>1?p.filter((_,i)=>i!==idx):p);

  useEffect(()=>{if(prefill){setItems(prev=>{const first=prev[0]||{...emptyItem};return[{...first,itemCategory:prefill.category||first.itemCategory,itemBrand:prefill.brand||first.itemBrand,itemName:prefill.itemName||first.itemName,itemCondition:prefill.condition||first.itemCondition,itemFeatures:prefill.notes||first.itemFeatures,itemAccessories:prefill.accessories||first.itemAccessories,purchasePrice:prefill.result?.recommended_price?.toString()||first.purchasePrice},...prev.slice(1)]})}},[prefill]);

  const visReq=["date","sellerName","sellerAddress","sellerPhone","sellerIdType","sellerIdNumber","idVerifiedBy","staffName"];
  const visOk=visReq.every(f=>visit[f]?.trim());
  const itemsOk=items.every(it=>it.itemName?.trim()&&it.purchasePrice?.trim());
  const ok=visOk&&itemsOk;

  const save=()=>{
    items.forEach((it,i)=>{
      onSave({...visit,...it,id:Date.now().toString()+"-"+i,timestamp:new Date().toISOString()});
    });
    setSaved(true);setTimeout(()=>setSaved(false),3000);
  };

  return(<div style={{padding:16}}>
    <div style={{background:cl.accentBg,borderRadius:8,padding:14,marginBottom:16,border:"1px solid "+cl.accentL}}><p style={{fontSize:12,fontWeight:700,color:cl.accent,margin:"0 0 6px",fontFamily:font}}>古物営業法に基づく記録義務</p><p style={{fontSize:11,color:cl.textM,margin:0,lineHeight:1.7,fontFamily:font}}>第16条・第17条により記録・3年間保存義務があります。</p></div>

    <Box title="訪問情報"><Input label="取引日" value={visit.date} onChange={v=>uv("date",v)} type="date" required/><Input label="訪問先" value={visit.transactionLocation} onChange={v=>uv("transactionLocation",v)} placeholder="東京都○○区○○ 1-2-3"/><Input label="担当者" value={visit.staffName} onChange={v=>uv("staffName",v)} required placeholder="担当者名"/></Box>

    <Box title="売主情報"><Input label="氏名" value={visit.sellerName} onChange={v=>uv("sellerName",v)} required placeholder="山田 太郎"/><Input label="フリガナ" value={visit.sellerNameKana} onChange={v=>uv("sellerNameKana",v)} placeholder="ヤマダ タロウ"/><Input label="生年月日" value={visit.sellerDob} onChange={v=>uv("sellerDob",v)} type="date"/><Input label="住所" value={visit.sellerAddress} onChange={v=>uv("sellerAddress",v)} required placeholder="東京都○○区○○"/><Input label="電話番号" value={visit.sellerPhone} onChange={v=>uv("sellerPhone",v)} required placeholder="090-XXXX-XXXX"/></Box>

    <Box title="本人確認"><Sel label="身分証の種類" value={visit.sellerIdType} onChange={v=>uv("sellerIdType",v)} options={ID_TYPES} required/><Input label="身分証番号" value={visit.sellerIdNumber} onChange={v=>uv("sellerIdNumber",v)} required placeholder="番号"/><Input label="確認者" value={visit.idVerifiedBy} onChange={v=>uv("idVerifiedBy",v)} required placeholder="確認者名"/><Sel label="確認方法" value={visit.idVerifyMethod} onChange={v=>uv("idVerifyMethod",v)} options={["対面（身分証提示）","対面（コピー取得）","非対面（画像送付）"]}/></Box>

    {items.map((it,idx)=>(<Box key={idx} title={"商品 "+(idx+1)}>
      <Input label="品目" value={it.itemCategory} onChange={v=>ui(idx,"itemCategory",v)} placeholder="時計・宝飾品類"/>
      <Input label="ブランド" value={it.itemBrand} onChange={v=>ui(idx,"itemBrand",v)} placeholder="ロレックス"/>
      <Input label="商品名/型番" value={it.itemName} onChange={v=>ui(idx,"itemName",v)} required placeholder="デイトナ Ref.116500LN"/>
      <Input label="状態" value={it.itemCondition} onChange={v=>ui(idx,"itemCondition",v)} placeholder="A 美品"/>
      <Input label="特徴" value={it.itemFeatures} onChange={v=>ui(idx,"itemFeatures",v)} multiline placeholder="色・シリアル等"/>
      <Input label="付属品" value={it.itemAccessories} onChange={v=>ui(idx,"itemAccessories",v)} placeholder="箱、保証書"/>
      <Input label="買取金額（円）" value={it.purchasePrice} onChange={v=>ui(idx,"purchasePrice",v)} type="number" required/>
      {items.length>1&&<button onClick={()=>removeItem(idx)} style={{background:"none",border:"1px solid "+cl.danger,borderRadius:6,padding:"6px 12px",fontSize:11,color:cl.danger,cursor:"pointer",fontFamily:font,width:"100%"}}>この商品を削除</button>}
    </Box>))}

    <div style={{marginBottom:14}}><Btn onClick={addItem} variant="secondary">+ 商品を追加</Btn></div>

    <Box title="備考"><Input label="備考" value={visit.remarks} onChange={v=>uv("remarks",v)} multiline placeholder="特記事項"/></Box>

    <Btn onClick={save} disabled={!ok}>{saved?"保存しました（"+items.length+"件）":"台帳に保存（"+items.length+"件）"}</Btn>
    {!ok&&<p style={{fontSize:11,color:cl.danger,textAlign:"center",marginTop:8,fontFamily:font}}>必須項目（*）と各商品の商品名・金額を入力してください</p>}
  </div>);
}

// ─── History Tab (admin only) ───────────────────────────────────────
function HistoryTab({records,role}){
  const [sel,setSel]=useState(null);
  if(!records.length)return<div style={{padding:48,textAlign:"center"}}><p style={{fontSize:14,color:cl.textD,fontFamily:font}}>記録なし</p></div>;
  if(sel){const r=sel;return(<div style={{padding:16}}><button onClick={()=>setSel(null)} style={{background:"none",border:"none",color:cl.accent,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:font,marginBottom:14,padding:0}}>← 戻る</button><Box title="取引">{[["日付",r.date],["場所",r.transactionLocation],["担当",r.staffName]].map(([l,v])=><Row key={l} label={l} value={v}/>)}</Box><Box title="商品">{[["品目",r.itemCategory],["ブランド",r.itemBrand],["商品名",r.itemName],["状態",r.itemCondition],["付属品",r.itemAccessories],["金額",fmt(r.purchasePrice)]].map(([l,v])=><Row key={l} label={l} value={v}/>)}</Box><Box title="売主" type="admin">{[["氏名",r.sellerName],["住所",r.sellerAddress],["電話",r.sellerPhone]].map(([l,v])=><Row key={l} label={l} value={v} bc={cl.adminBorder}/>)}</Box><Box title="本人確認" type="admin">{[["証明書",r.sellerIdType],["番号",r.sellerIdNumber],["確認者",r.idVerifiedBy]].map(([l,v])=><Row key={l} label={l} value={v} bc={cl.adminBorder}/>)}</Box></div>)}
  return(<div style={{padding:16}}><p style={{fontSize:12,color:cl.textD,margin:"0 0 12px",fontFamily:font}}>{records.length}件</p>{records.map(r=>(<div key={r.id} onClick={()=>setSel(r)} style={{background:cl.surface,borderRadius:8,border:"1px solid "+cl.border,padding:12,marginBottom:8,cursor:"pointer"}}><div style={{display:"flex",justifyContent:"space-between"}}><div><p style={{fontSize:13,fontWeight:700,color:cl.text,margin:"0 0 2px",fontFamily:font}}>{r.itemBrand} {r.itemName}</p><p style={{fontSize:11,color:cl.textD,margin:0,fontFamily:font}}>{r.date} ・ {r.sellerName} ・ 担当:{r.staffName}</p></div><p style={{fontSize:14,fontWeight:800,color:cl.accent,margin:0,fontFamily:font}}>{fmt(r.purchasePrice)}</p></div></div>))}</div>);
}

// ─── Dashboard (admin) ──────────────────────────────────────────────
function Dashboard({records}){
  const total=records.reduce((s,r)=>s+(Number(r.purchasePrice)||0),0);const today=new Date().toISOString().slice(0,10);const tR=records.filter(r=>r.date===today);const tT=tR.reduce((s,r)=>s+(Number(r.purchasePrice)||0),0);
  return(<div style={{padding:16}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>{[{l:"総件数",v:records.length+"件"},{l:"総買取額",v:fmt(total)},{l:"本日",v:tR.length+"件"},{l:"本日額",v:fmt(tT)}].map(({l,v})=>(<div key={l} style={{background:cl.adminBg,borderRadius:8,padding:"12px 14px",border:"1px solid "+cl.adminBorder}}><p style={{margin:0,fontSize:10,color:cl.adminAccent,fontWeight:600,fontFamily:font}}>{l}</p><p style={{margin:"4px 0 0",fontSize:18,fontWeight:800,color:cl.text,fontFamily:font}}>{v}</p></div>))}</div></div>);
}

// ─── Login ──────────────────────────────────────────────────────────
function LoginScreen({onLogin}){
  const [pin,setPin]=useState("");const [role,setRole]=useState(null);const [err,setErr]=useState("");
  const go=()=>{if(role==="admin"&&pin==="9999"){onLogin("admin");return}if(role==="staff"&&(pin==="1234"||pin==="9999")){onLogin("staff");return}setErr("PINが正しくありません");setTimeout(()=>setErr(""),2000)};
  return(<div style={{maxWidth:400,margin:"0 auto",minHeight:"100vh",background:cl.bg,fontFamily:font,display:"flex",flexDirection:"column",justifyContent:"center",padding:24}}><div style={{textAlign:"center",marginBottom:36}}><h1 style={{fontSize:20,fontWeight:800,color:cl.accent,margin:"0 0 4px",letterSpacing:2}}>出張買取</h1><p style={{fontSize:12,color:cl.textD,margin:0}}>AI査定 ・ 古物台帳記録</p></div><Box title="ログイン"><p style={{fontSize:12,color:cl.textM,margin:"0 0 14px",fontFamily:font}}>役割を選択してPINを入力</p><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:18}}>{[["admin","管理者","売却先・履歴・管理",cl.adminBg,cl.adminAccent],["staff","スタッフ","査定・台帳入力",cl.accentBg,cl.accent]].map(([id,label,desc,bg,co])=>(<button key={id} onClick={()=>setRole(id)} style={{padding:"16px 12px",background:role===id?bg:cl.surfAlt,border:"2px solid "+(role===id?co:cl.border),borderRadius:8,cursor:"pointer",textAlign:"center"}}><p style={{margin:0,fontSize:14,fontWeight:700,color:role===id?co:cl.text,fontFamily:font}}>{label}</p><p style={{margin:"4px 0 0",fontSize:11,color:cl.textD,fontFamily:font}}>{desc}</p></button>))}</div>{role&&<><Input label="PIN" value={pin} onChange={setPin} placeholder="PINを入力" type="password" required/><Btn onClick={go} disabled={pin.length<4} variant={role==="admin"?"admin":"primary"}>ログイン</Btn>{err&&<p style={{fontSize:12,color:cl.danger,textAlign:"center",marginTop:8,fontFamily:font}}>{err}</p>}</>}</Box></div>);
}

// ─── Main App ───────────────────────────────────────────────────────
export default function Home(){
  const [role,setRole]=useState(null);const [tab,setTab]=useState("appraisal");const [records,setRecords]=useState([]);const [prefill,setPrefill]=useState(null);const [mounted,setMounted]=useState(false);
  useEffect(()=>{setMounted(true);setRecords(loadRecords())},[]);
  const addRecord=rec=>{const up=[rec,...records];setRecords(up);saveRecords(up)};
  if(!mounted)return null;if(!role)return<LoginScreen onLogin={r=>{setRole(r);setTab(r==="admin"?"dashboard":"appraisal")}}/>;
  const isAdmin=role==="admin";

  // Admin: dashboard, history, (appraisal with sales intel)
  // Staff: appraisal, ledger (no history)
  const tabs=isAdmin
    ?[{id:"dashboard",label:"ダッシュボード"},{id:"appraisal",label:"査定"},{id:"history",label:"履歴・台帳"}]
    :[{id:"appraisal",label:"査定"},{id:"legal",label:"台帳記録"}];

  return(<div style={{maxWidth:480,margin:"0 auto",minHeight:"100vh",background:cl.bg,fontFamily:font}}>
    <style>{"@keyframes spin{to{transform:rotate(360deg)}}*{box-sizing:border-box}input,select,textarea{font-family:'Noto Sans JP',sans-serif}input::-webkit-outer-spin-button,input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}"}</style>
    <div style={{padding:"14px 16px",background:isAdmin?cl.adminBg:cl.surface,borderBottom:"1px solid "+(isAdmin?cl.adminBorder:cl.border),display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><h1 style={{margin:0,fontSize:16,fontWeight:800,color:isAdmin?cl.adminAccent:cl.accent,letterSpacing:1.5}}>出張買取</h1><p style={{margin:"1px 0 0",fontSize:10,color:cl.textD}}>AI査定 ・ 古物台帳記録</p></div><div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:10,fontWeight:700,padding:"4px 10px",borderRadius:4,fontFamily:font,background:isAdmin?cl.adminAccent:cl.accent,color:cl.white}}>{isAdmin?"管理者":"スタッフ"}</span><button onClick={()=>{setRole(null);setTab("appraisal")}} style={{background:"none",border:"1px solid "+cl.border,borderRadius:4,padding:"4px 10px",fontSize:10,color:cl.textD,cursor:"pointer",fontFamily:font}}>ログアウト</button></div></div>
    <div style={{display:"flex",background:cl.surface,borderBottom:"1px solid "+cl.border,position:"sticky",top:0,zIndex:100}}>{tabs.map(t=>(<button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:"11px 0",background:"none",border:"none",borderBottom:tab===t.id?"2px solid "+cl.accent:"2px solid transparent",color:tab===t.id?cl.accent:cl.textD,fontSize:12,fontWeight:tab===t.id?700:400,cursor:"pointer",fontFamily:font}}>{t.label}</button>))}</div>
    {tab==="dashboard"&&isAdmin&&<Dashboard records={records}/>}
    {tab==="appraisal"&&<AppraisalTab role={role} onSaveToLegal={d=>{setPrefill(d);setTab(isAdmin?"history":"legal")}}/>}
    {tab==="legal"&&!isAdmin&&<LegalTab prefill={prefill} onSave={addRecord}/>}
    {tab==="history"&&isAdmin&&<HistoryTab records={records} role={role}/>}
    <div style={{padding:"14px 16px 34px",textAlign:"center"}}><p style={{fontSize:10,color:cl.textD,margin:0}}>AI査定はウェブ検索による参考価格です。</p></div>
  </div>);
}
