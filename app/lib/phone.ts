const mainlandMobilePattern=/^1[3-9]\d{9}$/;

const obviousFakePatterns=[
  /^(\d)\1{10}$/,
  /^(?:12345678901|10987654321)$/,
];

export function normalizeMainlandMobile(value:string){
  return value.replace(/\D/g,"").slice(0,11);
}

export function validateMainlandMobile(value:string){
  const phone=normalizeMainlandMobile(value);
  if(phone.length!==11)return {valid:false,message:"请输入11位家长手机号"};
  if(!mainlandMobilePattern.test(phone))return {valid:false,message:"手机号号段不正确，请检查后重试"};
  if(obviousFakePatterns.some(pattern=>pattern.test(phone)))return {valid:false,message:"请输入真实可联系的家长手机号"};
  if(new Set(phone).size<=2)return {valid:false,message:"请输入真实可联系的家长手机号"};
  return {valid:true,message:""};
}
