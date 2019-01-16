/**
 * complete.ly 1.0.2
 * MIT Licensing
 * Copyright (c) 2013 Lorenzo Puccetti
 * Modified 2016 Alexander Whipp
 *
 * This Software shall be used for doing good things, not bad things.
 *
 **/
function completely(e,f){function a(e){return i===undefined&&((i=document.createElement("span")).style.visibility="hidden",i.style.position="fixed",i.style.outline="0",i.style.margin="0",i.style.padding="0",i.style.border="0",i.style.left="0",i.style.whiteSpace="pre",i.style.fontSize=f.fontSize,i.style.fontFamily=f.fontFamily,i.style.fontWeight="normal",document.body.appendChild(i)),i.innerHTML=String(e).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/'/g,"&#39;").replace(/</g,"&lt;").replace(/>/g,"&gt;"),i.getBoundingClientRect().right}(f=f||{}).fontSize=f.fontSize||"16px",f.fontFamily=f.fontFamily||"sans-serif",f.promptInnerHTML=f.promptInnerHTML||"",f.color=f.color||"#333",f.hintColor=f.hintColor||"#aaa",f.backgroundColor=f.backgroundColor||"#fff",f.dropDownBorderColor=f.dropDownBorderColor||"#aaa",f.dropDownZIndex=f.dropDownZIndex||"100",f.dropDownOnHoverBackgroundColor=f.dropDownOnHoverBackgroundColor||"#ddd",f.ignoreCase=f.ignoreCase||!1;var s=document.createElement("input");s.type="text",s.spellcheck=!1,s.style.fontSize=f.fontSize,s.style.fontFamily=f.fontFamily,s.style.color=f.color,s.style.backgroundColor=f.backgroundColor,s.style.width="100%",s.style.outline="0",s.style.border="0",s.style.margin="0",s.style.padding="0";var d=s.cloneNode();d.disabled="",d.style.position="absolute",d.style.top="0",d.style.left="0",d.style.borderColor="transparent",d.style.boxShadow="none",d.style.color=f.hintColor,s.style.backgroundColor="transparent",s.style.verticalAlign="top",s.style.position="relative",s.classList.add("location-input"),s.id="location-input-"+locationInputId,s.name="location_"+e.id,locationInputId+=1;var t=document.createElement("div");t.style.position="relative",t.style.outline="0",t.style.border="0",t.style.margin="0",t.style.padding="0";var n=document.createElement("div");if(n.style.position="absolute",n.style.outline="0",n.style.margin="0",n.style.padding="0",n.style.border="0",n.style.fontSize=f.fontSize,n.style.fontFamily=f.fontFamily,n.style.color=f.color,n.style.backgroundColor=f.backgroundColor,n.style.top="0",n.style.left="0",n.style.overflow="hidden",n.innerHTML=f.promptInnerHTML,n.style.background="transparent",document.body===undefined)throw"document.body is undefined. The library was wired up incorrectly.";document.body.appendChild(n);var o=n.getBoundingClientRect().right;t.appendChild(n),n.style.visibility="visible",n.style.left="-"+o+"px",t.style.marginLeft=o+"px",t.appendChild(d),t.appendChild(s);var u=document.createElement("div");u.style.position="absolute",u.style.visibility="hidden",u.style.outline="0",u.style.margin="0",u.style.padding="0",u.style.textAlign="left",u.style.fontSize=f.fontSize,u.style.fontFamily=f.fontFamily,u.style.backgroundColor=f.backgroundColor,u.style.zIndex=f.dropDownZIndex,u.style.cursor="default",u.style.borderStyle="solid",u.style.borderWidth="1px",u.style.borderColor=f.dropDownBorderColor,u.style.overflowX="hidden",u.style.whiteSpace="pre",u.style.overflowY="scroll";var i,y,c=function(s){var d=[],u=0,t=-1,y=function(){this.style.outline="1px solid #ddd"},c=function(){this.style.outline="0"},p=function(){v.hide(),v.onmouseselection(this.__hint)},v={hide:function(){s.style.visibility="hidden"},refresh:function(e,t){u=0,s.innerHTML="";var n=window.innerHeight||document.documentElement.clientHeight,o=s.parentNode.getBoundingClientRect(),i=o.top-6,l=n-o.bottom-6;d=[];for(var r=0;r<t.length;r++){if(f.ignoreCase){if(0!==t[r].toLowerCase().indexOf(e.toLowerCase()))continue}else if(0!==t[r].indexOf(e))continue;var a=document.createElement("div");a.style.color=f.color,a.onmouseover=y,a.onmouseout=c,a.onmousedown=p,a.__hint=t[r],a.innerHTML=e+"<b>"+t[r].substring(e.length)+"</b>",d.push(a),s.appendChild(a)}0!==d.length&&(1===d.length&&e===d[0].__hint||d.length<2||(v.highlight(0),3*l<i?(s.style.maxHeight=i+"px",s.style.top="",s.style.bottom="100%"):(s.style.top="100%",s.style.bottom="",s.style.maxHeight=l+"px"),s.style.paddingLeft="1em",s.style.paddingRight="1em"))},highlight:function(e){-1!=t&&d[t]&&(d[t].style.backgroundColor=f.backgroundColor),d[e].style.backgroundColor=f.dropDownOnHoverBackgroundColor,t=e},move:function(e){return"hidden"===s.style.visibility?"":(u+e===-1||u+e===d.length||(u+=e,v.highlight(u)),d[u].__hint)},onmouseselection:function(){}};return v}(u);c.onmouseselection=function(e){s.value=d.value=y+e,p.onChange(s.value),l=s.value,u.style.visibility="hidden"},s.onfocus=function(){u.style.visibility="visible"},s.onkeydown=function(){u.style.visibility="visible"},s.onblur=function(){u.style.visibility="hidden"},t.appendChild(u),e.appendChild(t);var l,p={onArrowDown:function(){},onArrowUp:function(){},onEnter:function(){},onTab:function(){},onChange:function(){p.repaint()},startFrom:0,options:[],wrapper:t,input:s,hint:d,dropDown:u,prompt:n,setText:function(e){d.value=e,s.value=e},getText:function(){return s.value},hideDropDown:function(){c.hide()},repaint:function(){var e=s.value,t=p.startFrom,n=p.options,o=n.length,i=e.substring(t);if(y=e.substring(0,t),d.value="",f.ignoreCase)for(var l=0;l<o;l++){if(0===(r=n[l]).toLowerCase().indexOf(i.toLowerCase())){d.value=y+i+r.substring(i.length);break}}else for(l=0;l<o;l++){var r;if(0===(r=n[l]).indexOf(i)){d.value=y+r;break}}u.style.left=a(y)+"px",c.refresh(i,p.options)}};(function(t,n){l=t.value;var e=function(){var e=t.value;f.ignoreCase?l.toLowerCase()!==e.toLowerCase()&&n(l=e):l!==e&&n(l=e)};t.addEventListener?(t.addEventListener("input",e,!1),t.addEventListener("keyup",e,!1),t.addEventListener("change",e,!1)):(t.attachEvent("oninput",e),t.attachEvent("onkeyup",e),t.attachEvent("onchange",e))})(s,function(e){p.onChange(e)});var r=function(e){var t=(e=e||window.event).keyCode;if(33!=t&&34!=t){if(27==t)return c.hide(),d.value=s.value,void s.focus();if(39!=t&&35!=t&&9!=t)if(13!=t){var n;if(40==t)return""==(n=c.move(1))&&p.onArrowDown(),void(d.value=y+n);if(38==t)return""==(n=c.move(-1))&&p.onArrowUp(),d.value=y+n,e.preventDefault(),void e.stopPropagation();d.value=""}else if(0==d.value.length)p.onEnter();else{var o="hidden"==u.style.visibility;if(c.hide(),o)return d.value=s.value,s.focus(),void p.onEnter();s.value=d.value;i=l!=s.value;l=s.value,i&&p.onChange(s.value)}else if(9==t&&(e.preventDefault(),e.stopPropagation(),0==d.value.length&&p.onTab()),0<d.value.length){c.hide(),s.value=d.value;var i=l!=s.value;l=s.value,i&&p.onChange(s.value)}}};return s.addEventListener?s.addEventListener("keydown",r,!1):s.attachEvent("onkeydown",r),p}var locationInputId=1;