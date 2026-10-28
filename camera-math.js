export const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));

export function pointerPan(x,y,width,height,maxX=24,maxY=16){
  if(![x,y,width,height].every(Number.isFinite)||width<=0||height<=0)return{x:0,y:0};
  return{x:-clamp((x/width-.5)*2,-1,1)*maxX,y:-clamp((y/height-.5)*2,-1,1)*maxY};
}

export function screenTilt(beta,gamma,angle=0){
  if(![beta,gamma,angle].every(Number.isFinite))return null;
  const radians=angle*Math.PI/180;
  return{x:gamma*Math.cos(radians)+beta*Math.sin(radians),y:beta*Math.cos(radians)-gamma*Math.sin(radians)};
}

export function tiltPan(point,center,maxX=12,maxY=8){
  if(!point||!center)return{x:0,y:0};
  const response=value=>{
    const wrapped=((value+180)%360+360)%360-180;
    return Math.sign(wrapped)*clamp((Math.abs(wrapped)-1.2)/16.8,0,1);
  };
  return{x:-response(point.x-center.x)*maxX,y:-response(point.y-center.y)*maxY};
}

export function scenePoint(x,y,width,height,pose){
  return{x:width/2+(x-width/2-pose.x)/pose.z,y:height/2+(y-height/2-pose.y)/pose.z};
}

export function poseAtPoint(point,width,height,z){
  return{x:(width/2-point.x)*z,y:(height/2-point.y)*z,z};
}
