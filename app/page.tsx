"use client";

import { useEffect, useMemo, useState } from "react";
import { courseVocabulary, diagnosticVocabulary, pepVocabulary, testableVocabulary } from "./data/courseVocabulary";

type Phase = "home" | "profile" | "test" | "gate" | "result" | "admin";
type Kind = "meaning" | "spelling" | "listening" | "context" | "confusing";
type Question = { word: string; prompt: string; options: string[]; answer: string; accepted?: string[]; kind: Kind; level: number };
type Profile = { name: string; grade: string; score: string; total: string; issue: string; phone: string };

const baseQuestions: Question[] = [
  { word:"quiet", prompt:"quiet 的正确含义是？", options:["安静的","快速的","昂贵的","困难的"], answer:"安静的", kind:"meaning", level:1 },
  { word:"borrow", prompt:"borrow 的正确含义是？", options:["借入","借出","购买","归还"], answer:"借入", kind:"meaning", level:1 },
  { word:"environment", prompt:"environment 的正确含义是？", options:["环境","发展","政府","比赛"], answer:"环境", kind:"meaning", level:2 },
  { word:"especially", prompt:"especially 的正确含义是？", options:["尤其","最终","立刻","几乎"], answer:"尤其", kind:"meaning", level:2 },
  { word:"responsibility", prompt:"responsibility 的正确含义是？", options:["责任","机会","经验","结果"], answer:"责任", kind:"meaning", level:3 },
  { word:"encourage", prompt:"encourage 的正确含义是？", options:["鼓励","阻止","原谅","保护"], answer:"鼓励", kind:"meaning", level:3 },
  { word:"necessary", prompt:"请选择“必要的”的正确拼写", options:["necessary","neccessary","necessery","necesary"], answer:"necessary", kind:"spelling", level:2 },
  { word:"successful", prompt:"请选择“成功的”的正确拼写", options:["successful","succesful","successfull","sucsessful"], answer:"successful", kind:"spelling", level:2 },
  { word:"difference", prompt:"请选择“区别”的正确拼写", options:["difference","diffrence","differance","differentce"], answer:"difference", kind:"spelling", level:3 },
  { word:"knowledge", prompt:"请选择“知识”的正确拼写", options:["knowledge","knowlege","knowledg","nolledge"], answer:"knowledge", kind:"spelling", level:3 },
  { word:"weather", prompt:"点击播放后，选择你听到的单词", options:["weather","whether","winner","winter"], answer:"weather", kind:"listening", level:2 },
  { word:"practice", prompt:"点击播放后，选择你听到的单词", options:["practice","promise","purpose","progress"], answer:"practice", kind:"listening", level:2 },
  { word:"improve", prompt:"点击播放后，选择你听到的单词", options:["improve","include","invite","imagine"], answer:"improve", kind:"listening", level:3 },
  { word:"protect", prompt:"We should ___ the environment and save water.", options:["protect","prepare","provide","produce"], answer:"protect", kind:"context", level:2 },
  { word:"instead", prompt:"Tom stayed home ___ of going out in the rain.", options:["instead","inside","indeed","including"], answer:"instead", kind:"context", level:2 },
  { word:"unless", prompt:"You will miss the bus ___ you leave now.", options:["unless","because","although","while"], answer:"unless", kind:"context", level:3 },
  { word:"receive", prompt:"I was happy to ___ a letter from my friend.", options:["receive","accept","borrow","lend"], answer:"receive", kind:"confusing", level:2 },
  { word:"advice", prompt:"My teacher gave me some useful ___.", options:["advice","advise","informationS","suggest"], answer:"advice", kind:"confusing", level:3 },
  { word:"spent", prompt:"Lily ___ two hours finishing her homework.", options:["spent","cost","took","paid"], answer:"spent", kind:"confusing", level:3 },
  { word:"hardly", prompt:"He was so tired that he could ___ keep his eyes open.", options:["hardly","hard","nearly","mostly"], answer:"hardly", kind:"context", level:3 },
];

const spellingQuestionBank: Question[] = [
  {word:"beginning",prompt:"begin 的现在分词，哪项拼写正确？",options:["beginning","begining","begginning","begininng"],answer:"beginning",kind:"spelling",level:2},
  {word:"preferred",prompt:"prefer 的过去式，哪项拼写正确？",options:["preferred","prefered","preffered","preferredd"],answer:"preferred",kind:"spelling",level:3},
  {word:"studies",prompt:"study 的第三人称单数，哪项正确？",options:["studies","studys","studyies","studyes"],answer:"studies",kind:"spelling",level:2},
  {word:"carried",prompt:"carry 的过去式，哪项正确？",options:["carried","carryed","caried","carrid"],answer:"carried",kind:"spelling",level:2},
  {word:"lying",prompt:"lie 的现在分词，哪项正确？",options:["lying","lieing","lyeing","liying"],answer:"lying",kind:"spelling",level:3},
  {word:"written",prompt:"write 的过去分词，哪项正确？",options:["written","writen","writted","writtan"],answer:"written",kind:"spelling",level:2},
  {word:"ninth",prompt:"nine 的序数词，哪项正确？",options:["ninth","nineth","ninethh","ninetth"],answer:"ninth",kind:"spelling",level:2},
  {word:"twelfth",prompt:"twelve 的序数词，哪项正确？",options:["twelfth","twelveth","twelvth","twelth"],answer:"twelfth",kind:"spelling",level:3},
  {word:"forty",prompt:"数字40的英文，哪项拼写正确？",options:["forty","fourty","fortey","fourtyy"],answer:"forty",kind:"spelling",level:2},
  {word:"necessary",prompt:"“必要的”哪项拼写正确？",options:["necessary","neccessary","necessery","necesary"],answer:"necessary",kind:"spelling",level:3},
  {word:"successful",prompt:"“成功的”哪项拼写正确？",options:["successful","succesful","successfull","sucsessful"],answer:"successful",kind:"spelling",level:3},
  {word:"difference",prompt:"“区别”哪项拼写正确？",options:["difference","diffrence","differance","differentce"],answer:"difference",kind:"spelling",level:3},
  {word:"knowledge",prompt:"“知识”哪项拼写正确？",options:["knowledge","knowlege","knowledg","nolledge"],answer:"knowledge",kind:"spelling",level:3},
  {word:"environment",prompt:"“环境”哪项拼写正确？",options:["environment","enviroment","envirnment","environmentt"],answer:"environment",kind:"spelling",level:3},
  {word:"especially",prompt:"“尤其”哪项拼写正确？",options:["especially","especialy","expecially","especialley"],answer:"especially",kind:"spelling",level:3},
  {word:"responsibility",prompt:"“责任”哪项拼写正确？",options:["responsibility","responsability","responsibilty","responcibility"],answer:"responsibility",kind:"spelling",level:3},
  {word:"comfortable",prompt:"“舒适的”哪项拼写正确？",options:["comfortable","confortable","comfortible","comfortablee"],answer:"comfortable",kind:"spelling",level:2},
  {word:"government",prompt:"“政府”哪项拼写正确？",options:["government","goverment","governmentt","govenment"],answer:"government",kind:"spelling",level:3},
  {word:"development",prompt:"“发展”哪项拼写正确？",options:["development","developement","devlopment","developmant"],answer:"development",kind:"spelling",level:3},
  {word:"encouragement",prompt:"encourage 的名词形式，哪项正确？",options:["encouragement","encouragment","encouragementt","encouragament"],answer:"encouragement",kind:"spelling",level:3},
  {word:"travelling",prompt:"travel 的现在分词（英式），哪项正确？",options:["travelling","travelingg","travelng","travveling"],answer:"travelling",accepted:["traveling"],kind:"spelling",level:3},
  {word:"cancelled",prompt:"cancel 的过去式（英式），哪项正确？",options:["cancelled","canceledd","cancelld","canselled"],answer:"cancelled",accepted:["canceled"],kind:"spelling",level:3},
  {word:"colour",prompt:"“颜色”的英式拼写，哪项正确？",options:["colour","colur","collour","coloure"],answer:"colour",accepted:["color"],kind:"spelling",level:2},
  {word:"organise",prompt:"“组织”的英式拼写，哪项正确？",options:["organise","orgnise","organisee","organnise"],answer:"organise",accepted:["organize"],kind:"spelling",level:3},
];

const labels: Record<Kind,string> = { meaning:"词义理解", spelling:"拼写能力", listening:"听音辨词", context:"语境运用", confusing:"易混词辨析" };
const icons: Record<Kind,string> = { meaning:"Aa", spelling:"✎", listening:"◉", context:"▤", confusing:"↔" };
const audioReadyWords = ["weather","practice","improve","protect","environment","encourage","necessary","successful","difference","knowledge","comfortable","government","development","responsibility","especially","instead","unless","healthy","important","possible","popular","language","future","student","teacher","friend","morning","holiday","journey","answer","special","English","experience","excellent","expensive","favourite","festival","friendly","geography","honest","include","information","inside","international","interview","invite","island","library","medicine","museum","opinion","passage","perfect","prepare","problem","programme","progress","pronounce","provide","public","really","reason","recommend","relationship","research","respect","society","theatre","traffic","tradition","travel","village","volunteer","whether","wonderful"];
function BrandLogo({compact=false}:{compact?:boolean}){return <img className={compact?"brand-logo-only compact":"brand-logo-only"} src="/brand/xueersi-peiyou-transparent.png" alt="学而思培优 Logo"/>}

function seededShuffle<T>(items:T[],seed:number){const list=[...items];let s=seed||1;for(let i=list.length-1;i>0;i--){s=(s*9301+49297)%233280;const j=Math.floor(s/233280*(i+1));[list[i],list[j]]=[list[j],list[i]]}return list}
function isCorrectAnswer(q:Question,option:string){return option===q.answer||(q.accepted||[]).includes(option)}
function buildQuestions(grade:string,seed:number){
  const elementary=testableVocabulary.filter(x=>x.elementary&&x.word.length>=4);
  const middle=testableVocabulary.filter(x=>!x.elementary&&x.word.length>=5);
  const middleShare=grade==="五年级"?.15:grade==="六年级"?.25:grade==="初一"?.45:grade==="初二"?.65:.8;
  const selected=[...seededShuffle(elementary,seed).slice(0,Math.round(40*(1-middleShare))),...seededShuffle(middle,seed+17).slice(0,Math.round(40*middleShare))];
  const baseSpelling=new Set(baseQuestions.filter(q=>q.kind==="spelling").map(q=>q.word));
  const spelling=seededShuffle(spellingQuestionBank.filter(q=>!baseSpelling.has(q.word)),seed+31).slice(0,20).map((q,i)=>({...q,options:seededShuffle(q.options.filter(o=>o===q.answer||!(q.accepted||[]).includes(o)),seed+i)}));
  const audioPool=audioReadyWords.map(word=>testableVocabulary.find(x=>x.word.toLowerCase()===word.toLowerCase())).filter(Boolean) as typeof testableVocabulary;
  const listening=seededShuffle(audioPool,seed+73).slice(0,20).map((x,i)=>{const distractors=seededShuffle(audioPool.filter(y=>y.word!==x.word&&Math.abs(y.word.length-x.word.length)<=3),seed+i+80).slice(0,3).map(y=>y.word);return {word:x.word,prompt:"点击播放真人词典发音后，选择你听到的单词",options:seededShuffle([x.word,...distractors],seed+i+120),answer:x.word,kind:"listening" as Kind,level:x.elementary?1:(x.word.length>8?3:2)}});
  return seededShuffle([...baseQuestions,...spelling,...listening],seed+999).slice(0,60);
}

export default function Home(){
  const [phase,setPhase] = useState<Phase>("home");
  const [profile,setProfile] = useState<Profile>({name:"",grade:"初二",score:"",total:"100",issue:"背完容易忘",phone:""});
  const [index,setIndex] = useState(0);
  const [answers,setAnswers] = useState<{q:Question; chosen:string; correct:boolean}[]>([]);
  const [records,setRecords] = useState<any[]>([]);
  const [saving,setSaving] = useState(false);
  const [testSeed,setTestSeed] = useState(2022);
  const [questions,setQuestions] = useState<Question[]>(()=>buildQuestions(profile.grade,testSeed));
  const [adaptiveLevel,setAdaptiveLevel] = useState(2);
  const [streak,setStreak] = useState({correct:0,wrong:0});
  const result = useMemo(()=>{
    const total = Math.max(answers.length,1); const correct = answers.filter(a=>a.correct).length;
    const rate = Math.round(correct/total*100);
    const scores = Object.fromEntries((Object.keys(labels) as Kind[]).map(k=>{
      const rows=answers.filter(a=>a.q.kind===k); return [k, rows.length?Math.round(rows.filter(a=>a.correct).length/rows.length*100):0];
    })) as Record<Kind,number>;
    const estimate = Math.max(420,Math.min(1780,Math.round((420+rate*13.6)/20)*20));
    const weakest=(Object.keys(scores) as Kind[]).sort((a,b)=>scores[a]-scores[b])[0];
    return {correct,rate,scores,estimate,weakest,wrong:answers.filter(a=>!a.correct).slice(0,12)};
  },[answers]);

  useEffect(()=>{ try{setRecords(JSON.parse(localStorage.getItem("word-diagnostic-records")||"[]"));}catch{} },[]);
  const start=()=>{setAnswers([]);setIndex(0);setPhase("profile");window.scrollTo(0,0)};
  const beginTest=()=>{const seed=Date.now()%1000000;const initial=["五年级","六年级"].includes(profile.grade)?1:profile.grade==="初三"?3:2;setTestSeed(seed);setQuestions(buildQuestions(profile.grade,seed));setAdaptiveLevel(initial);setStreak({correct:0,wrong:0});setIndex(0);setAnswers([]);setPhase("test")};
  const choose=(option:string)=>{
    const q=questions[index]; const correct=isCorrectAnswer(q,option); const next=[...answers,{q,chosen:option,correct}]; setAnswers(next);
    const nextStreak={correct:correct?streak.correct+1:0,wrong:correct?0:streak.wrong+1};let target=adaptiveLevel;
    if(nextStreak.correct>=2){target=Math.min(3,adaptiveLevel+1);nextStreak.correct=0}
    if(nextStreak.wrong>=2){target=Math.max(1,adaptiveLevel-1);nextStreak.wrong=0}
    setStreak(nextStreak);setAdaptiveLevel(target);
    if(index===questions.length-1){setPhase("gate");} else {setQuestions(current=>{const copy=[...current];const match=copy.findIndex((item,i)=>i>index&&item.level===target);if(match>index+1)[copy[index+1],copy[match]]=[copy[match],copy[index+1]];return copy});setIndex(index+1)}
  };
  const speak=()=>{const audio=new Audio("/api/pronunciation?word="+encodeURIComponent(questions[index].word));audio.play().catch(()=>alert("真人发音暂时加载失败，请检查网络后重试。"))};
  const unlock=async()=>{
    if(!/^1\d{10}$/.test(profile.phone)) return;
    setSaving(true);
    const record={id:Date.now(),date:new Date().toLocaleString("zh-CN"),...profile,estimate:result.estimate,rate:result.rate,type:labels[result.weakest],wrong:result.wrong.map(x=>x.q.word)};
    try{
      const response=await fetch("/api/diagnostics",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({studentName:profile.name,grade:profile.grade,recentScore:profile.score,scoreTotal:profile.total,learningIssue:profile.issue,phone:profile.phone,estimatedVocabulary:result.estimate,accuracyRate:result.rate,weakestArea:labels[result.weakest],abilityScores:result.scores,wrongWords:result.wrong.map(x=>x.q.word)})});
      if(!response.ok) throw new Error("cloud save unavailable");
    }catch{
      const next=[record,...records]; setRecords(next); localStorage.setItem("word-diagnostic-records",JSON.stringify(next));
    }finally{setSaving(false);setPhase("result");window.scrollTo(0,0)}
  };

  if(phase==="test") return <TestPage q={questions[index]} index={index} total={questions.length} adaptiveLevel={adaptiveLevel} choose={choose} speak={speak} onExit={()=>setPhase("home")}/>;
  if(phase==="gate") return <Gate profile={profile} setProfile={setProfile} result={result} unlock={unlock} saving={saving} onBack={()=>setPhase("home")}/>;
  if(phase==="result") return <Result profile={profile} result={result} restart={start}/>;
  if(phase==="admin") return <Admin localRecords={records} onBack={()=>setPhase("home")}/>;
  if(phase==="profile") return <ProfilePage profile={profile} setProfile={setProfile} submit={beginTest} back={()=>setPhase("home")}/>;

  return <main className="site-shell"><div className="internal-banner">内部测试版 · 请使用测试手机号，暂勿录入真实家长信息</div>
    <nav className="nav"><button className="brand" onClick={()=>setPhase("home")} aria-label="返回学而思词汇诊断首页"><BrandLogo/></button><div className="navlinks"><a href="#why">产品介绍</a><a href="#method">如何测试</a><a href="#report">诊断报告</a></div><button className="admin-link" onClick={()=>setPhase("admin")}>老师后台</button></nav>
    <section className="hero">
      <div className="hero-copy"><div className="eyebrow">小学高年级—初三 · 免费测评</div><h1>中考1800词<br/><em>词汇能力诊断</em></h1><p>15分钟测出孩子<strong>会多少、忘在哪、该怎么补</strong></p><button className="primary" onClick={start}>免费开始测试 <span>→</span></button><div className="trust-row"><span>▤ 60道自适应题</span><span>◇ 五维能力分析</span><span>▣ 三节课·6小时短期班</span></div><div className="standard-note">词库构成：教育部2022课标 {courseVocabulary.length} 项必会词条 + 北京人教版教材 {pepVocabulary.length} 项拓展词条</div></div>
      <ReportPreview/>
    </section>
    <section className="stats"><div><b>{diagnosticVocabulary.length}</b><span>项诊断词条</span></div><div><b>60</b><span>道自适应测试</span></div><div><b>5</b><span>项能力分析</span></div><div><b>1</b><span>份专属报告</span></div></section>
    <section id="why" className="section"><div className="section-heading"><span>为什么要测</span><h2>“背过”不等于真正掌握</h2><p>从认识、拼写到语境运用，找到孩子词汇学习中真正的断点。</p></div><div className="feature-grid">{(["meaning","spelling","listening","context","confusing"] as Kind[]).map((k,i)=><article key={k}><i className={'feature-icon c'+i}>{icons[k]}</i><h3>{labels[k]}</h3><p>{["看到英文，能否准确理解词义","从中文到英文，是否真正写得出","听到发音，能否对应正确单词","放进中考句子，是否能灵活使用","近义词、形近词能否准确区分"][i]}</p></article>)}</div></section>
    <section id="method" className="section soft"><div className="section-heading"><span>测试流程</span><h2>三步找到词汇薄弱点</h2></div><div className="steps"><div><b>01</b><h3>填写学习情况</h3><p>年级、成绩与背词困难</p></div><div><b>02</b><h3>完成分层测试</h3><p>系统根据表现评估五项能力</p></div><div><b>03</b><h3>领取诊断报告</h3><p>查看诊断并了解三节课6小时短期班</p></div></div></section>
    <section id="report" className="cta-section"><div><span>每个错词，都在告诉我们该怎么教</span><h2>先找准薄弱点，再用三节课6小时集中突破</h2></div><button className="primary light" onClick={start}>免费开始测试 →</button></section>
    <footer><BrandLogo compact/><span>中考1800词·词汇能力诊断</span><small>本测评结果为抽样估算，仅作为学习规划参考</small></footer>
  </main>
}

function ReportPreview(){const data=[82,68,76,72,64];return <div className="preview-wrap"><span className="float-letter a">A</span><span className="float-letter b">B</span><div className="report-card"><div className="report-top"><div><small>词汇能力诊断报告</small><h3>预计掌握 <b>1260</b> 词</h3></div><div className="ring">78<sup>分</sup></div></div><div className="chart-area"><div className="radar"><span>词义</span><span>拼写</span><span>听辨</span><span>语境</span><span>辨析</span><i></i></div><div className="bars">{data.map((v,i)=><div key={i}><p><span>{["词义理解","拼写能力","听音辨词","语境运用","易混辨析"][i]}</span><b>{v}</b></p><i><em style={{width:v+'%'}}></em></i></div>)}</div></div><div className="report-note"><span>● 当前水平</span><b>初二基础阶段</b><small>优先提升：拼写与易混词</small></div></div></div>}

function ProfilePage({profile,setProfile,submit,back}:{profile:Profile;setProfile:(p:Profile)=>void;submit:()=>void;back:()=>void}){const update=(k:keyof Profile,v:string)=>setProfile({...profile,[k]:v});return <main className="flow-page"><FlowHeader back={back}/><div className="form-card"><div className="step-pill">第 1 步 / 共 2 步</div><h1>先了解一下孩子的学习情况</h1><p>这些信息会帮助我们生成更准确的诊断建议</p><label>孩子怎么称呼<input value={profile.name} onChange={e=>update("name",e.target.value)} placeholder="例如：小明"/></label><label>当前年级<div className="option-row">{["五年级","六年级","初一","初二","初三"].map(x=><button className={profile.grade===x?"selected":""} key={x} onClick={()=>update("grade",x)}>{x}</button>)}</div></label><div className="field-row"><label>最近英语成绩<input inputMode="numeric" value={profile.score} onChange={e=>update("score",e.target.value)} placeholder="例如：82"/></label><label>试卷满分<select value={profile.total} onChange={e=>update("total",e.target.value)}><option>100</option><option>120</option><option>150</option></select></label></div><label>目前背单词最大的困难<select value={profile.issue} onChange={e=>update("issue",e.target.value)}><option>背完容易忘</option><option>会认但不会拼</option><option>认识单词但不会做题</option><option>背得慢、效率低</option><option>缺少监督、无法坚持</option></select></label><button className="primary full" disabled={!profile.name||!profile.score} onClick={submit}>开始60题诊断 →</button></div></main>}

function FlowHeader({back}:{back:()=>void}){return <header className="flow-header"><button onClick={back}>← 返回</button><BrandLogo compact/><small>约15分钟完成</small></header>}

function TestPage({q,index,total,adaptiveLevel,choose,speak,onExit}:{q:Question;index:number;total:number;adaptiveLevel:number;choose:(s:string)=>void;speak:()=>void;onExit:()=>void}){return <main className="test-page"><FlowHeader back={onExit}/><div className="progress-head"><span>{labels[q.kind]} · 自适应难度 {adaptiveLevel}/3</span><b>{index+1} <small>/ {total}</small></b></div><div className="progress"><i style={{width:((index+1)/total*100)+'%'}}/></div><section className="question-card" key={q.word+"-"+index}><div className="adaptive-note">系统正根据前序答题表现动态调整下一题难度</div><div className="qtype"><i>{icons[q.kind]}</i>{labels[q.kind]}</div><h1>{q.prompt}</h1>{q.kind==="listening"&&<button className="audio" onClick={speak}>▶ 播放单词发音</button>}<div className="answers">{q.options.map((o,i)=><button key={q.word+"-"+o} onClick={e=>{e.currentTarget.blur();choose(o)}}><span>{String.fromCharCode(65+i)}</span>{o}</button>)}</div><p className="tip">请凭第一感觉作答，不确定也没关系</p></section></main>}

function Gate({profile,setProfile,result,unlock,saving,onBack}:{profile:Profile;setProfile:(p:Profile)=>void;result:any;unlock:()=>void;saving:boolean;onBack:()=>void}){const valid=/^1\d{10}$/.test(profile.phone);return <main className="gate-page"><FlowHeader back={onBack}/><section className="gate-card"><div className="test-warning">内部测试：请填写测试手机号，暂勿录入真实家长信息</div><div className="success-check">✓</div><span>测试已完成</span><h1>{profile.name}的基础诊断已生成</h1><div className="teaser"><div><small>答题正确率</small><b>{result.rate}%</b></div><div><small>预计掌握范围</small><b>{Math.max(300,result.estimate-100)}—{result.estimate+100}词</b></div><div className="locked">🔒 五维分析、完整错词与学习建议待解锁</div></div><h2>输入测试手机号，查看完整报告</h2><p>内部体验数据将集中保存，方便统一验证后台流程</p><input className="phone" inputMode="numeric" maxLength={11} value={profile.phone} onChange={e=>setProfile({...profile,phone:e.target.value.replace(/\D/g,"")})} placeholder="例如：13800000001"/><button className="primary full" disabled={!valid||saving} onClick={unlock}>{saving?"正在保存…":"解锁完整报告 →"}</button><small className="privacy">内部测试数据将在验证结束后统一清理</small></section></main>}

function Result({profile,result,restart}:{profile:Profile;result:any;restart:()=>void}){const plans:Record<Kind,{type:string;focus:string;outcome:string}>={meaning:{type:"基础词义缺口型",focus:"高频词义与一词多义",outcome:"看到核心词能快速反应"},spelling:{type:"会认不会拼型",focus:"音节拆分与拼写规则",outcome:"把认识的词稳定写出来"},listening:{type:"音形脱节型",focus:"发音、词形双向绑定",outcome:"听到单词能准确识别"},context:{type:"会背不会用型",focus:"中考句型与语境搭配",outcome:"从背词迁移到做题"},confusing:{type:"易混辨析薄弱型",focus:"形近词与近义词对比",outcome:"减少选择题低级失分"}};const plan=plans[result.weakest as Kind];return <main className="result-page"><FlowHeader back={()=>location.reload()}/><section className="result-hero"><div><span>{profile.name}的专属报告</span><h1>中考1800词·词汇能力诊断</h1><p>{profile.grade} · 本次共完成60道自适应题</p></div><div className="estimate"><small>预计掌握中考核心词汇</small><b>{result.estimate}<em>词</em></b><span>预计范围 {Math.max(300,result.estimate-100)}—{result.estimate+100}词</span></div></section><section className="result-grid"><article className="ability-card"><div className="card-title"><div><span>五维能力分析</span><h2>优势清晰，短板也很明确</h2></div><b>{result.rate}<small>综合分</small></b></div>{(Object.keys(labels) as Kind[]).map((k,i)=><div className="ability-row" key={k}><i className={'c'+i}>{icons[k]}</i><span>{labels[k]}</span><div><em style={{width:result.scores[k]+'%'}}/></div><b>{result.scores[k]}</b></div>)}</article><article className="diagnosis-card"><span>核心诊断</span><h2>{labels[result.weakest as Kind]}是当前首要提升点</h2><p>孩子属于“{plan.type}”。建议优先训练{plan.focus}，目标是{plan.outcome}。</p><div className="action-list"><b>三节课·6小时短期提升重点</b><p>① 第1课（2小时）：定位词汇漏洞，建立音形义连接</p><p>② 第2课（2小时）：攻克拼写、词形变化与易混词</p><p>③ 第3课（2小时）：中考语境训练与阶段复测</p></div></article></section><section className="wrong-card"><div className="card-title"><div><span>本次代表性错词</span><h2>不是背得少，而是要练得更精准</h2></div><small>共 {60-result.correct} 题待巩固</small></div><div className="wrong-grid">{result.wrong.length?result.wrong.map((x:any,i:number)=><div key={i}><b>{x.q.word}</b><span>{labels[x.q.kind as Kind]}</span><small>你的答案：{x.chosen}</small><em>正确：{x.q.answer}</em></div>):<p>表现很棒，本次抽样题目全部答对！</p>}</div></section><section className="teacher-cta"><div><span>测评后匹配的短期提升班</span><h2>三节课·6小时词汇短期班</h2><p>围绕本次报告中的真实薄弱项，集中解决词义、拼写、听辨、语境和易混词问题。</p></div><button onClick={()=>alert("了解意向已记录，老师将通过预留手机号联系您。")}>点击了解短期班 →</button></section><button className="restart" onClick={restart}>重新测试</button></main>}

function Admin({localRecords,onBack}:{localRecords:any[];onBack:()=>void}){const [cloud,setCloud]=useState<any[]>([]);const [loading,setLoading]=useState(true);const [authed,setAuthed]=useState(false);const [password,setPassword]=useState("");const [error,setError]=useState("");const load=()=>fetch("/api/diagnostics").then(async r=>{if(!r.ok)throw new Error(String(r.status));const d=await r.json();setCloud(d.records||[]);setAuthed(true)}).finally(()=>setLoading(false));useEffect(()=>{load().catch(()=>setLoading(false))},[]);const updateStatus=async(id:number,followUpStatus:string)=>{const r=await fetch("/api/diagnostics",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,followUpStatus})});if(r.ok)setCloud(rows=>rows.map(x=>x.id===id?{...x,followUpStatus}:x))};const login=async()=>{setLoading(true);setError("");try{const r=await fetch("/api/admin/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({password})});if(!r.ok){const d=await r.json();throw new Error(d.error||"登录失败")}await load()}catch(e){setError(e instanceof Error?e.message:"登录失败");setLoading(false)}};if(!authed)return <main className="admin-login-page"><button className="login-back" onClick={onBack}>← 返回测试首页</button><section className="admin-login-card"><div className="login-lock">🔐</div><span>内部管理入口</span><h1>老师后台登录</h1><p>请输入后台专用密码查看手机号与诊断记录</p><input type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&login()} placeholder="请输入后台密码" autoFocus/>{error&&<em>{error}</em>}<button className="primary full" disabled={!password||loading} onClick={login}>{loading?"正在验证…":"登录后台 →"}</button><small>登录状态将在8小时后自动失效</small></section></main>;const records=(cloud.length?cloud:localRecords).map(r=>r.studentName?{...r,name:r.studentName,score:r.recentScore,total:r.scoreTotal,estimate:r.estimatedVocabulary,rate:r.accuracyRate,type:r.weakestArea,date:r.createdAt}:r);const exportCsv=()=>{const heads=["学生","年级","手机号","成绩","预计词汇","正确率","薄弱点","跟进状态","提交时间"];const esc=(v:any)=>`"${String(v??"").replace(/"/g,'""')}"`;const rows=records.map(r=>[r.name,r.grade,r.phone,`${r.score}/${r.total}`,r.estimate,r.rate+"%",r.type,r.followUpStatus||"未跟进",r.date]);const blob=new Blob(["\ufeff"+[heads,...rows].map(row=>row.map(esc).join(",")).join("\n")],{type:"text/csv;charset=utf-8"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`词汇诊断线索-${new Date().toISOString().slice(0,10)}.csv`;a.click();URL.revokeObjectURL(url)};return <main className="admin-page"><header><div><button onClick={onBack}>← 返回网站</button><h1>词汇诊断·老师后台 <small>内部测试</small></h1></div><div><span>累计记录 <b>{records.length}</b></span><button className="export-btn" disabled={!records.length} onClick={exportCsv}>导出CSV</button></div></header><section className="admin-stats"><div><span>云端记录</span><b>{loading?"…":records.length}</b></div><div><span>平均正确率</span><b>{records.length?Math.round(records.reduce((s,r)=>s+r.rate,0)/records.length):0}%</b></div><div><span>平均预计词汇</span><b>{records.length?Math.round(records.reduce((s,r)=>s+r.estimate,0)/records.length):0}</b></div></section><section className="table-card"><div className="table-title"><h2>集中诊断记录</h2><span>所有设备提交的数据统一显示在这里</span></div>{records.length?<div className="table-wrap"><table><thead><tr><th>学生</th><th>年级</th><th>测试手机号</th><th>英语成绩</th><th>预计词汇</th><th>正确率</th><th>首要薄弱点</th><th>跟进状态</th><th>提交时间</th></tr></thead><tbody>{records.map(r=><tr key={r.id}><td><b>{r.name}</b></td><td>{r.grade}</td><td>{r.phone}</td><td>{r.score}/{r.total}</td><td>{r.estimate}词</td><td>{r.rate}%</td><td><span className="tag">{r.type}</span></td><td><select className="status-select" value={r.followUpStatus||"未跟进"} onChange={e=>updateStatus(r.id,e.target.value)}>{["未跟进","已联系","待再次联系","已预约解读","已报名","暂无意向"].map(s=><option key={s}>{s}</option>)}</select></td><td>{r.date}</td></tr>)}</tbody></table></div>:<div className="empty"><b>暂无云端诊断记录</b><p>同事完成测试并提交测试手机号后，记录会显示在这里。</p></div>}</section></main>}
