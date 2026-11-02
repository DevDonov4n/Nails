import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
const COOKIE = "nbs_admin_session";
async function adminSession() {
 const token=(await cookies()).get(COOKIE)?.value;if(!token)return false;
 const [payload,signature]=token.split(".");const secret=process.env.SESSION_SECRET;
 if(!payload||!signature||!secret||secret.length<32)return false;
 try{const expected=Buffer.from(createHmac("sha256",secret).update(payload).digest("base64url"));const received=Buffer.from(signature);if(expected.length!==received.length||!timingSafeEqual(expected,received))return false;const data=JSON.parse(Buffer.from(payload,"base64url").toString("utf8")) as {sub?:unknown;role?:unknown;exp?:unknown};return data.role==="admin"&&typeof data.sub==="string"&&typeof data.exp==="number"&&data.exp>Math.floor(Date.now()/1000);}catch{return false;}
}
const categories=["MATERIAL_NOVO","REPOSICAO","URGENCIA","MANUTENCAO","OUTROS"] as const;
export async function POST(request:NextRequest){
 if(!(await adminSession()))return NextResponse.json({error:"Não autorizado."},{status:401});
 let body:unknown;try{body=await request.json();}catch{return NextResponse.json({error:"Dados inválidos."},{status:400});}
 if(!body||typeof body!=="object")return NextResponse.json({error:"Dados inválidos."},{status:400});
 const data=body as Record<string,unknown>;const amount=data.amount;const category=data.category;const description=typeof data.description==="string"?data.description.trim():"";
 if(typeof amount!=="number"||!Number.isFinite(amount)||amount<=0||amount>1000000)return NextResponse.json({error:"Informe um valor de saída válido."},{status:400});
 if(typeof category!=="string"||!categories.includes(category as typeof categories[number]))return NextResponse.json({error:"Selecione uma categoria válida."},{status:400});
 if(description.length<5||description.length>500)return NextResponse.json({error:"A justificativa deve ter entre 5 e 500 caracteres."},{status:400});
 try{const expense=await prisma.expense.create({data:{amount:Math.round(amount*100),category,description},select:{id:true,amount:true,category:true,description:true,occurredAt:true}});return NextResponse.json({expense:{...expense,amount:expense.amount/100,occurredAt:expense.occurredAt.toISOString()}},{status:201,headers:{"Cache-Control":"no-store"}});}
 catch(error){console.error("Erro ao registrar saída financeira:",error);return NextResponse.json({error:"Não foi possível registrar a saída. Verifique a migração do banco."},{status:503});}
}
