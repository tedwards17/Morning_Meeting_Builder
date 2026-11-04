export type ImageBounds={x:number;y:number;width:number;height:number;fullWidth:number;fullHeight:number};
// Find visible pixels without changing the stored image. Alpha <= 8 is padding.
export function visibleBounds(pixels:ArrayLike<number>,width:number,height:number):ImageBounds{
 let left=width,top=height,right=-1,bottom=-1;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(pixels[(y*width+x)*4+3]>8){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
 return right<left?{x:0,y:0,width,height,fullWidth:width,fullHeight:height}:{x:left,y:top,width:right-left+1,height:bottom-top+1,fullWidth:width,fullHeight:height};
}
export function logoFrame(bounds:ImageBounds,size=100,trim=true){
 const b=trim?bounds:{...bounds,x:0,y:0,width:bounds.fullWidth,height:bounds.fullHeight};
 const ratio=b.width/b.height,height=4*Math.min(100,Math.max(25,Number(size)||100))/100,width=Math.min(35,height*ratio);
 return {width:width+'cqw',height:width/ratio+'cqw',image:{width:100*b.fullWidth/b.width+'%',height:100*b.fullHeight/b.height+'%',left:-100*b.x/b.width+'%',top:-100*b.y/b.height+'%'}};
}
