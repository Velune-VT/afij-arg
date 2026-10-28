export const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));

export function pointerPan(x,y,width,height,maxX=24,maxY=16){
  if(![x,y,width,height].every(Number.isFinite)||width<=0||height<=0)return{x:0,y:0};
  return{x:-clamp((x/width-.5)*2,-1,1)*maxX,y:-clamp((y/height-.5)*2,-1,1)*maxY};
}

export function scenePoint(x,y,width,height,pose){
  return{x:width/2+(x-width/2-pose.x)/pose.z,y:height/2+(y-height/2-pose.y)/pose.z};
}

export function poseAtPoint(point,width,height,z){
  return{x:(width/2-point.x)*z,y:(height/2-point.y)*z,z};
}
