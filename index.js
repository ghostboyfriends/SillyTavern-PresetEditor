/*
 * 预设编辑器 (Preset Editor) for SillyTavern
 * 一个用于直观编辑 / 新建「聊天补全(Chat Completion)预设」中提示词条目的工具。
 *
 * 功能:
 *  1. 编辑器：列出当前预设的所有提示词条目，可拖动排序、启用/禁用、编辑、复制、删除、新建。
 *  2. 教程：解释提示词管理器里每个字段(名称/角色/位置/深度/禁止覆盖/占位符...)的含义和效果。
 *  3. 思维链预览：按 AI 实际读取的顺序，自上而下展示条目排列(含绝对深度注入的可视化)。
 *  4. 保存：应用到当前会话 + 尝试写回命名预设；另支持导出/导入 JSON。
 *
 * 说明:本扩展只编辑「提示词条目」部分。采样参数(温度/top_p 等)请在 SillyTavern 原生面板调整。
 */

import { eventSource, event_types } from "../../../../script.js";
import { getContext } from "../../../extensions.js";

/* ===== 内嵌 SortableJS 1.15.7 (MIT) —— 缝合台拖拽 ===== */
/*! Sortable 1.15.7 - MIT | git://github.com/SortableJS/Sortable.git */
!function(t,e){"object"==typeof exports&&"undefined"!=typeof module?module.exports=e():"function"==typeof define&&define.amd?define(e):(t=t||self).Sortable=e()}(this,function(){"use strict";function o(t,e){(null==e||e>t.length)&&(e=t.length);for(var n=0,o=Array(e);n<e;n++)o[n]=t[n];return o}function i(t,e,n){return(e=function(t){t=function(t,e){if("object"!=typeof t||!t)return t;var n=t[Symbol.toPrimitive];if(void 0===n)return("string"===e?String:Number)(t);e=n.call(t,e||"default");if("object"!=typeof e)return e;throw new TypeError("@@toPrimitive must return a primitive value.")}(t,"string");return"symbol"==typeof t?t:t+""}(e))in t?Object.defineProperty(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}):t[e]=n,t}function a(){return(a=Object.assign?Object.assign.bind():function(t){for(var e=1;e<arguments.length;e++){var n,o=arguments[e];for(n in o)!{}.hasOwnProperty.call(o,n)||(t[n]=o[n])}return t}).apply(null,arguments)}function r(e,t){var n,o=Object.keys(e);return Object.getOwnPropertySymbols&&(n=Object.getOwnPropertySymbols(e),t&&(n=n.filter(function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable})),o.push.apply(o,n)),o}function I(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?r(Object(n),!0).forEach(function(t){i(e,t,n[t])}):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):r(Object(n)).forEach(function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))})}return e}function l(t,e){if(null==t)return{};var n,o=function(t,e){if(null==t)return{};var n,o={};for(n in t)if({}.hasOwnProperty.call(t,n)){if(-1!==e.indexOf(n))continue;o[n]=t[n]}return o}(t,e);if(Object.getOwnPropertySymbols)for(var i=Object.getOwnPropertySymbols(t),r=0;r<i.length;r++)n=i[r],-1===e.indexOf(n)&&{}.propertyIsEnumerable.call(t,n)&&(o[n]=t[n]);return o}function e(t){return function(t){if(Array.isArray(t))return o(t)}(t)||function(t){if("undefined"!=typeof Symbol&&null!=t[Symbol.iterator]||null!=t["@@iterator"])return Array.from(t)}(t)||function(t,e){if(t){if("string"==typeof t)return o(t,e);var n={}.toString.call(t).slice(8,-1);return"Map"===(n="Object"===n&&t.constructor?t.constructor.name:n)||"Set"===n?Array.from(t):"Arguments"===n||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?o(t,e):void 0}}(t)||function(){throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function s(t){return(s="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t})(t)}function t(t){if("undefined"!=typeof window&&window.navigator)return!!navigator.userAgent.match(t)}var y=t(/(?:Trident.*rv[ :]?11\.|msie|iemobile|Windows Phone)/i),w=t(/Edge/i),c=t(/firefox/i),u=t(/safari/i)&&!t(/chrome/i)&&!t(/android/i),d=t(/iP(ad|od|hone)/i),n=t(/chrome/i)&&t(/android/i),h={capture:!1,passive:!1};function f(t,e,n){t.addEventListener(e,n,!y&&h)}function p(t,e,n){t.removeEventListener(e,n,!y&&h)}function g(t,e){if(e&&(">"===e[0]&&(e=e.substring(1)),t))try{if(t.matches)return t.matches(e);if(t.msMatchesSelector)return t.msMatchesSelector(e);if(t.webkitMatchesSelector)return t.webkitMatchesSelector(e)}catch(t){return}}function m(t){return t.host&&t!==document&&t.host.nodeType&&t.host!==t?t.host:t.parentNode}function P(t,e,n,o){if(t){n=n||document;do{if(null!=e&&(">"!==e[0]||t.parentNode===n)&&g(t,e)||o&&t===n)return t}while(t!==n&&(t=m(t)))}return null}var v,b=/\s+/g;function k(t,e,n){var o;t&&e&&(t.classList?t.classList[n?"add":"remove"](e):(o=(" "+t.className+" ").replace(b," ").replace(" "+e+" "," "),t.className=(o+(n?" "+e:"")).replace(b," ")))}function R(t,e,n){var o=t&&t.style;if(o){if(void 0===n)return document.defaultView&&document.defaultView.getComputedStyle?n=document.defaultView.getComputedStyle(t,""):t.currentStyle&&(n=t.currentStyle),void 0===e?n:n[e];o[e=!(e in o||-1!==e.indexOf("webkit"))?"-webkit-"+e:e]=n+("string"==typeof n?"":"px")}}function D(t,e){var n="";if("string"==typeof t)n=t;else do{var o=R(t,"transform")}while(o&&"none"!==o&&(n=o+" "+n),!e&&(t=t.parentNode));var i=window.DOMMatrix||window.WebKitCSSMatrix||window.CSSMatrix||window.MSCSSMatrix;return i&&new i(n)}function E(t,e,n){if(t){var o=t.getElementsByTagName(e),i=0,r=o.length;if(n)for(;i<r;i++)n(o[i],i);return o}return[]}function O(){var t=document.scrollingElement;return t||document.documentElement}function X(t,e,n,o,i){if(t.getBoundingClientRect||t===window){var r,a,l,s,c,u,d=t!==window&&t.parentNode&&t!==O()?(a=(r=t.getBoundingClientRect()).top,l=r.left,s=r.bottom,c=r.right,u=r.height,r.width):(l=a=0,s=window.innerHeight,c=window.innerWidth,u=window.innerHeight,window.innerWidth);if((e||n)&&t!==window&&(i=i||t.parentNode,!y))do{if(i&&i.getBoundingClientRect&&("none"!==R(i,"transform")||n&&"static"!==R(i,"position"))){var h=i.getBoundingClientRect();a-=h.top+parseInt(R(i,"border-top-width")),l-=h.left+parseInt(R(i,"border-left-width")),s=a+r.height,c=l+r.width;break}}while(i=i.parentNode);return o&&t!==window&&(o=(e=D(i||t))&&e.a,t=e&&e.d,e&&(s=(a/=t)+(u/=t),c=(l/=o)+(d/=o))),{top:a,left:l,bottom:s,right:c,width:d,height:u}}}function Y(t,e,n){for(var o=M(t,!0),i=X(t)[e];o;){var r=X(o)[n];if(!("top"===n||"left"===n?r<=i:i<=r))return o;if(o===O())break;o=M(o,!1)}return!1}function B(t,e,n,o){for(var i=0,r=0,a=t.children;r<a.length;){if("none"!==a[r].style.display&&a[r]!==Ht.ghost&&(o||a[r]!==Ht.dragged)&&P(a[r],n.draggable,t,!1)){if(i===e)return a[r];i++}r++}return null}function F(t,e){for(var n=t.lastElementChild;n&&(n===Ht.ghost||"none"===R(n,"display")||e&&!g(n,e));)n=n.previousElementSibling;return n||null}function j(t,e){var n=0;if(!t||!t.parentNode)return-1;for(;t=t.previousElementSibling;)"TEMPLATE"===t.nodeName.toUpperCase()||t===Ht.clone||e&&!g(t,e)||n++;return n}function S(t){var e=0,n=0,o=O();if(t)do{var i=D(t),r=i.a,i=i.d}while(e+=t.scrollLeft*r,n+=t.scrollTop*i,t!==o&&(t=t.parentNode));return[e,n]}function M(t,e){if(!t||!t.getBoundingClientRect)return O();var n=t,o=!1;do{if(n.clientWidth<n.scrollWidth||n.clientHeight<n.scrollHeight){var i=R(n);if(n.clientWidth<n.scrollWidth&&("auto"==i.overflowX||"scroll"==i.overflowX)||n.clientHeight<n.scrollHeight&&("auto"==i.overflowY||"scroll"==i.overflowY)){if(!n.getBoundingClientRect||n===document.body)return O();if(o||e)return n;o=!0}}}while(n=n.parentNode);return O()}function _(t,e){return Math.round(t.top)===Math.round(e.top)&&Math.round(t.left)===Math.round(e.left)&&Math.round(t.height)===Math.round(e.height)&&Math.round(t.width)===Math.round(e.width)}function C(e,n){return function(){var t;v||(1===(t=arguments).length?e.call(this,t[0]):e.apply(this,t),v=setTimeout(function(){v=void 0},n))}}function H(t,e,n){t.scrollLeft+=e,t.scrollTop+=n}function T(t){var e=window.Polymer,n=window.jQuery||window.Zepto;return e&&e.dom?e.dom(t).cloneNode(!0):n?n(t).clone(!0)[0]:t.cloneNode(!0)}function x(t,e){R(t,"position","absolute"),R(t,"top",e.top),R(t,"left",e.left),R(t,"width",e.width),R(t,"height",e.height)}function A(t){R(t,"position",""),R(t,"top",""),R(t,"left",""),R(t,"width",""),R(t,"height","")}function L(n,o,i){var r={};return Array.from(n.children).forEach(function(t){var e;P(t,o.draggable,n,!1)&&!t.animated&&t!==i&&(e=X(t),r.left=Math.min(null!==(t=r.left)&&void 0!==t?t:1/0,e.left),r.top=Math.min(null!==(t=r.top)&&void 0!==t?t:1/0,e.top),r.right=Math.max(null!==(t=r.right)&&void 0!==t?t:-1/0,e.right),r.bottom=Math.max(null!==(t=r.bottom)&&void 0!==t?t:-1/0,e.bottom))}),r.width=r.right-r.left,r.height=r.bottom-r.top,r.x=r.left,r.y=r.top,r}var K="Sortable"+(new Date).getTime();function N(){var e,o=[];return{captureAnimationState:function(){o=[],this.options.animation&&[].slice.call(this.el.children).forEach(function(t){var e,n;"none"!==R(t,"display")&&t!==Ht.ghost&&(o.push({target:t,rect:X(t)}),e=I({},o[o.length-1].rect),!t.thisAnimationDuration||(n=D(t,!0))&&(e.top-=n.f,e.left-=n.e),t.fromRect=e)})},addAnimationState:function(t){o.push(t)},removeAnimationState:function(t){o.splice(function(t,e){for(var n in t)if(t.hasOwnProperty(n))for(var o in e)if(e.hasOwnProperty(o)&&e[o]===t[n][o])return Number(n);return-1}(o,{target:t}),1)},animateAll:function(t){var c=this;if(!this.options.animation)return clearTimeout(e),void("function"==typeof t&&t());var u=!1,d=0;o.forEach(function(t){var e=0,n=t.target,o=n.fromRect,i=X(n),r=n.prevFromRect,a=n.prevToRect,l=t.rect,s=D(n,!0);s&&(i.top-=s.f,i.left-=s.e),n.toRect=i,n.thisAnimationDuration&&_(r,i)&&!_(o,i)&&(l.top-i.top)/(l.left-i.left)==(o.top-i.top)/(o.left-i.left)&&(t=l,s=r,r=a,a=c.options,e=Math.sqrt(Math.pow(s.top-t.top,2)+Math.pow(s.left-t.left,2))/Math.sqrt(Math.pow(s.top-r.top,2)+Math.pow(s.left-r.left,2))*a.animation),_(i,o)||(n.prevFromRect=o,n.prevToRect=i,e=e||c.options.animation,c.animate(n,l,i,e)),e&&(u=!0,d=Math.max(d,e),clearTimeout(n.animationResetTimer),n.animationResetTimer=setTimeout(function(){n.animationTime=0,n.prevFromRect=null,n.fromRect=null,n.prevToRect=null,n.thisAnimationDuration=null},e),n.thisAnimationDuration=e)}),clearTimeout(e),u?e=setTimeout(function(){"function"==typeof t&&t()},d):"function"==typeof t&&t(),o=[]},animate:function(t,e,n,o){var i,r;o&&(R(t,"transition",""),R(t,"transform",""),i=(r=D(this.el))&&r.a,r=r&&r.d,i=(e.left-n.left)/(i||1),r=(e.top-n.top)/(r||1),t.animatingX=!!i,t.animatingY=!!r,R(t,"transform","translate3d("+i+"px,"+r+"px,0)"),this.forRepaintDummy=t.offsetWidth,R(t,"transition","transform "+o+"ms"+(this.options.easing?" "+this.options.easing:"")),R(t,"transform","translate3d(0,0,0)"),"number"==typeof t.animated&&clearTimeout(t.animated),t.animated=setTimeout(function(){R(t,"transition",""),R(t,"transform",""),t.animated=!1,t.animatingX=!1,t.animatingY=!1},o))}}}var W=[],z={initializeByDefault:!0},G={mount:function(e){for(var t in z)!z.hasOwnProperty(t)||t in e||(e[t]=z[t]);W.forEach(function(t){if(t.pluginName===e.pluginName)throw"Sortable: Cannot mount plugin ".concat(e.pluginName," more than once")}),W.push(e)},pluginEvent:function(e,n,o){var t=this;this.eventCanceled=!1,o.cancel=function(){t.eventCanceled=!0};var i=e+"Global";W.forEach(function(t){n[t.pluginName]&&(n[t.pluginName][i]&&n[t.pluginName][i](I({sortable:n},o)),n.options[t.pluginName]&&n[t.pluginName][e]&&n[t.pluginName][e](I({sortable:n},o)))})},initializePlugins:function(n,o,i,t){for(var e in W.forEach(function(t){var e=t.pluginName;(n.options[e]||t.initializeByDefault)&&((t=new t(n,o,n.options)).sortable=n,t.options=n.options,n[e]=t,a(i,t.defaults))}),n.options){var r;n.options.hasOwnProperty(e)&&(void 0!==(r=this.modifyOption(n,e,n.options[e]))&&(n.options[e]=r))}},getEventProperties:function(e,n){var o={};return W.forEach(function(t){"function"==typeof t.eventProperties&&a(o,t.eventProperties.call(n[t.pluginName],e))}),o},modifyOption:function(e,n,o){var i;return W.forEach(function(t){e[t.pluginName]&&t.optionListeners&&"function"==typeof t.optionListeners[n]&&(i=t.optionListeners[n].call(e[t.pluginName],o))}),i}};function U(t){var e=t.sortable,n=t.rootEl,o=t.name,i=t.targetEl,r=t.cloneEl,a=t.toEl,l=t.fromEl,s=t.oldIndex,c=t.newIndex,u=t.oldDraggableIndex,d=t.newDraggableIndex,h=t.originalEvent,f=t.putSortable,p=t.extraEventProperties;if(e=e||n&&n[K]){var g,m=e.options,t="on"+o.charAt(0).toUpperCase()+o.substr(1);!window.CustomEvent||y||w?(g=document.createEvent("Event")).initEvent(o,!0,!0):g=new CustomEvent(o,{bubbles:!0,cancelable:!0}),g.to=a||n,g.from=l||n,g.item=i||n,g.clone=r,g.oldIndex=s,g.newIndex=c,g.oldDraggableIndex=u,g.newDraggableIndex=d,g.originalEvent=h,g.pullMode=f?f.lastPutMode:void 0;var v,b=I(I({},p),G.getEventProperties(o,e));for(v in b)g[v]=b[v];n&&n.dispatchEvent(g),m[t]&&m[t].call(e,g)}}function q(t,e){var n=(o=2<arguments.length&&void 0!==arguments[2]?arguments[2]:{}).evt,o=l(o,V);G.pluginEvent.bind(Ht)(t,e,I({dragEl:$,parentEl:Q,ghostEl:J,rootEl:tt,nextEl:et,lastDownEl:nt,cloneEl:ot,cloneHidden:it,dragStarted:vt,putSortable:ut,activeSortable:Ht.active,originalEvent:n,oldIndex:rt,oldDraggableIndex:lt,newIndex:at,newDraggableIndex:st,hideGhostForTarget:Yt,unhideGhostForTarget:Bt,cloneNowHidden:function(){it=!0},cloneNowShown:function(){it=!1},dispatchSortableEvent:function(t){Z({sortable:e,name:t,originalEvent:n})}},o))}var V=["evt"];function Z(t){U(I({putSortable:ut,cloneEl:ot,targetEl:$,rootEl:tt,oldIndex:rt,oldDraggableIndex:lt,newIndex:at,newDraggableIndex:st},t))}var $,Q,J,tt,et,nt,ot,it,rt,at,lt,st,ct,ut,dt,ht,ft,pt,gt,mt,vt,bt,yt,wt,Dt,Et=!1,St=!1,_t=[],Ct=!1,Tt=!1,xt=[],Ot=!1,Mt=[],At="undefined"!=typeof document,Nt=d,It=w||y?"cssFloat":"float",Pt=At&&!n&&!d&&"draggable"in document.createElement("div"),kt=function(){if(At){if(y)return!1;var t=document.createElement("x");return t.style.cssText="pointer-events:auto","auto"===t.style.pointerEvents}}(),Rt=function(t,e){var n=R(t),o=parseInt(n.width)-parseInt(n.paddingLeft)-parseInt(n.paddingRight)-parseInt(n.borderLeftWidth)-parseInt(n.borderRightWidth),i=B(t,0,e),r=B(t,1,e),a=i&&R(i),l=r&&R(r),s=a&&parseInt(a.marginLeft)+parseInt(a.marginRight)+X(i).width,t=l&&parseInt(l.marginLeft)+parseInt(l.marginRight)+X(r).width;if("flex"===n.display)return"column"===n.flexDirection||"column-reverse"===n.flexDirection?"vertical":"horizontal";if("grid"===n.display)return n.gridTemplateColumns.split(" ").length<=1?"vertical":"horizontal";if(i&&a.float&&"none"!==a.float){e="left"===a.float?"left":"right";return!r||"both"!==l.clear&&l.clear!==e?"horizontal":"vertical"}return i&&("block"===a.display||"flex"===a.display||"table"===a.display||"grid"===a.display||o<=s&&"none"===n[It]||r&&"none"===n[It]&&o<s+t)?"vertical":"horizontal"},Xt=function(t){function l(r,a){return function(t,e,n,o){var i=t.options.group.name&&e.options.group.name&&t.options.group.name===e.options.group.name;if(null==r&&(a||i))return!0;if(null==r||!1===r)return!1;if(a&&"clone"===r)return r;if("function"==typeof r)return l(r(t,e,n,o),a)(t,e,n,o);e=(a?t:e).options.group.name;return!0===r||"string"==typeof r&&r===e||r.join&&-1<r.indexOf(e)}}var e={},n=t.group;n&&"object"==s(n)||(n={name:n}),e.name=n.name,e.checkPull=l(n.pull,!0),e.checkPut=l(n.put),e.revertClone=n.revertClone,t.group=e},Yt=function(){!kt&&J&&R(J,"display","none")},Bt=function(){!kt&&J&&R(J,"display","")};At&&!n&&document.addEventListener("click",function(t){if(St)return t.preventDefault(),t.stopPropagation&&t.stopPropagation(),t.stopImmediatePropagation&&t.stopImmediatePropagation(),St=!1},!0);function Ft(t){if($){t=t.touches?t.touches[0]:t;var e=(i=t.clientX,r=t.clientY,_t.some(function(t){var e=t[K].options.emptyInsertThreshold;if(e&&!F(t)){var n=X(t),o=i>=n.left-e&&i<=n.right+e,e=r>=n.top-e&&r<=n.bottom+e;return o&&e?a=t:void 0}}),a);if(e){var n,o={};for(n in t)t.hasOwnProperty(n)&&(o[n]=t[n]);o.target=o.rootEl=e,o.preventDefault=void 0,o.stopPropagation=void 0,e[K]._onDragOver(o)}}var i,r,a}function jt(t){$&&$.parentNode[K]._isOutsideThisEl(t.target)}function Ht(t,e){if(!t||!t.nodeType||1!==t.nodeType)throw"Sortable: `el` must be an HTMLElement, not ".concat({}.toString.call(t));this.el=t,this.options=e=a({},e),t[K]=this;var n,o,i={group:null,sort:!0,disabled:!1,store:null,handle:null,draggable:/^[uo]l$/i.test(t.nodeName)?">li":">*",swapThreshold:1,invertSwap:!1,invertedSwapThreshold:null,removeCloneOnHide:!0,direction:function(){return Rt(t,this.options)},ghostClass:"sortable-ghost",chosenClass:"sortable-chosen",dragClass:"sortable-drag",ignore:"a, img",filter:null,preventOnFilter:!0,animation:0,easing:null,setData:function(t,e){t.setData("Text",e.textContent)},dropBubble:!1,dragoverBubble:!1,dataIdAttr:"data-id",delay:0,delayOnTouchOnly:!1,touchStartThreshold:(Number.parseInt?Number:window).parseInt(window.devicePixelRatio,10)||1,forceFallback:!1,fallbackClass:"sortable-fallback",fallbackOnBody:!1,fallbackTolerance:0,fallbackOffset:{x:0,y:0},supportPointer:!1!==Ht.supportPointer&&"PointerEvent"in window&&(!u||d),emptyInsertThreshold:5};for(n in G.initializePlugins(this,t,i),i)n in e||(e[n]=i[n]);for(o in Xt(e),this)"_"===o.charAt(0)&&"function"==typeof this[o]&&(this[o]=this[o].bind(this));this.nativeDraggable=!e.forceFallback&&Pt,this.nativeDraggable&&(this.options.touchStartThreshold=1),e.supportPointer?f(t,"pointerdown",this._onTapStart):(f(t,"mousedown",this._onTapStart),f(t,"touchstart",this._onTapStart)),this.nativeDraggable&&(f(t,"dragover",this),f(t,"dragenter",this)),_t.push(this.el),e.store&&e.store.get&&this.sort(e.store.get(this)||[]),a(this,N())}function Lt(t,e,n,o,i,r,a,l){var s,c,u=t[K],d=u.options.onMove;return!window.CustomEvent||y||w?(s=document.createEvent("Event")).initEvent("move",!0,!0):s=new CustomEvent("move",{bubbles:!0,cancelable:!0}),s.to=e,s.from=t,s.dragged=n,s.draggedRect=o,s.related=i||e,s.relatedRect=r||X(e),s.willInsertAfter=l,s.originalEvent=a,t.dispatchEvent(s),c=d?d.call(u,s,a):c}function Kt(t){t.draggable=!1}function Wt(){Ot=!1}function zt(t){return setTimeout(t,0)}function Gt(t){return clearTimeout(t)}Ht.prototype={constructor:Ht,_isOutsideThisEl:function(t){this.el.contains(t)||t===this.el||(bt=null)},_getDirection:function(t,e){return"function"==typeof this.options.direction?this.options.direction.call(this,t,e,$):this.options.direction},_onTapStart:function(e){if(e.cancelable){var n=this,o=this.el,t=this.options,i=t.preventOnFilter,r=e.type,a=e.touches&&e.touches[0]||e.pointerType&&"touch"===e.pointerType&&e,l=(a||e).target,s=e.target.shadowRoot&&(e.path&&e.path[0]||e.composedPath&&e.composedPath()[0])||l,c=t.filter;if(!function(t){Mt.length=0;var e=t.getElementsByTagName("input"),n=e.length;for(;n--;){var o=e[n];o.checked&&Mt.push(o)}}(o),!$&&!(/mousedown|pointerdown/.test(r)&&0!==e.button||t.disabled)&&!s.isContentEditable&&(this.nativeDraggable||!u||!l||"SELECT"!==l.tagName.toUpperCase())&&!((l=P(l,t.draggable,o,!1))&&l.animated||nt===l)){if(rt=j(l),lt=j(l,t.draggable),"function"==typeof c){if(c.call(this,e,l,this))return Z({sortable:n,rootEl:s,name:"filter",targetEl:l,toEl:o,fromEl:o}),q("filter",n,{evt:e}),void(i&&e.preventDefault())}else if(c=c&&c.split(",").some(function(t){if(t=P(s,t.trim(),o,!1))return Z({sortable:n,rootEl:t,name:"filter",targetEl:l,fromEl:o,toEl:o}),q("filter",n,{evt:e}),!0}))return void(i&&e.preventDefault());t.handle&&!P(s,t.handle,o,!1)||this._prepareDragStart(e,a,l)}}},_prepareDragStart:function(t,e,n){var o,i=this,r=i.el,a=i.options,l=r.ownerDocument;n&&!$&&n.parentNode===r&&(o=X(n),tt=r,Q=($=n).parentNode,et=$.nextSibling,nt=n,ct=a.group,dt={target:Ht.dragged=$,clientX:(e||t).clientX,clientY:(e||t).clientY},gt=dt.clientX-o.left,mt=dt.clientY-o.top,this._lastX=(e||t).clientX,this._lastY=(e||t).clientY,$.style["will-change"]="all",o=function(){q("delayEnded",i,{evt:t}),Ht.eventCanceled?i._onDrop():(i._disableDelayedDragEvents(),!c&&i.nativeDraggable&&($.draggable=!0),i._triggerDragStart(t,e),Z({sortable:i,name:"choose",originalEvent:t}),k($,a.chosenClass,!0))},a.ignore.split(",").forEach(function(t){E($,t.trim(),Kt)}),f(l,"dragover",Ft),f(l,"mousemove",Ft),f(l,"touchmove",Ft),a.supportPointer?(f(l,"pointerup",i._onDrop),this.nativeDraggable||f(l,"pointercancel",i._onDrop)):(f(l,"mouseup",i._onDrop),f(l,"touchend",i._onDrop),f(l,"touchcancel",i._onDrop)),c&&this.nativeDraggable&&(this.options.touchStartThreshold=4,$.draggable=!0),q("delayStart",this,{evt:t}),!a.delay||a.delayOnTouchOnly&&!e||this.nativeDraggable&&(w||y)?o():Ht.eventCanceled?this._onDrop():(a.supportPointer?(f(l,"pointerup",i._disableDelayedDrag),f(l,"pointercancel",i._disableDelayedDrag)):(f(l,"mouseup",i._disableDelayedDrag),f(l,"touchend",i._disableDelayedDrag),f(l,"touchcancel",i._disableDelayedDrag)),f(l,"mousemove",i._delayedDragTouchMoveHandler),f(l,"touchmove",i._delayedDragTouchMoveHandler),a.supportPointer&&f(l,"pointermove",i._delayedDragTouchMoveHandler),i._dragStartTimer=setTimeout(o,a.delay)))},_delayedDragTouchMoveHandler:function(t){t=t.touches?t.touches[0]:t;Math.max(Math.abs(t.clientX-this._lastX),Math.abs(t.clientY-this._lastY))>=Math.floor(this.options.touchStartThreshold/(this.nativeDraggable&&window.devicePixelRatio||1))&&this._disableDelayedDrag()},_disableDelayedDrag:function(){$&&Kt($),clearTimeout(this._dragStartTimer),this._disableDelayedDragEvents()},_disableDelayedDragEvents:function(){var t=this.el.ownerDocument;p(t,"mouseup",this._disableDelayedDrag),p(t,"touchend",this._disableDelayedDrag),p(t,"touchcancel",this._disableDelayedDrag),p(t,"pointerup",this._disableDelayedDrag),p(t,"pointercancel",this._disableDelayedDrag),p(t,"mousemove",this._delayedDragTouchMoveHandler),p(t,"touchmove",this._delayedDragTouchMoveHandler),p(t,"pointermove",this._delayedDragTouchMoveHandler)},_triggerDragStart:function(t,e){e=e||"touch"==t.pointerType&&t,!this.nativeDraggable||e?this.options.supportPointer?f(document,"pointermove",this._onTouchMove):f(document,e?"touchmove":"mousemove",this._onTouchMove):(f($,"dragend",this),f(tt,"dragstart",this._onDragStart));try{document.selection?zt(function(){document.selection.empty()}):window.getSelection().removeAllRanges()}catch(t){}},_dragStarted:function(t,e){var n;Et=!1,tt&&$?(q("dragStarted",this,{evt:e}),this.nativeDraggable&&f(document,"dragover",jt),n=this.options,t||k($,n.dragClass,!1),k($,n.ghostClass,!0),Ht.active=this,t&&this._appendGhost(),Z({sortable:this,name:"start",originalEvent:e})):this._nulling()},_emulateDragOver:function(){if(ht){this._lastX=ht.clientX,this._lastY=ht.clientY,Yt();for(var t=document.elementFromPoint(ht.clientX,ht.clientY),e=t;t&&t.shadowRoot&&(t=t.shadowRoot.elementFromPoint(ht.clientX,ht.clientY))!==e;)e=t;if($.parentNode[K]._isOutsideThisEl(t),e)do{if(e[K])if(e[K]._onDragOver({clientX:ht.clientX,clientY:ht.clientY,target:t,rootEl:e})&&!this.options.dragoverBubble)break}while(e=m(t=e));Bt()}},_onTouchMove:function(t){if(dt){var e=this.options,n=e.fallbackTolerance,o=e.fallbackOffset,i=t.touches?t.touches[0]:t,r=J&&D(J,!0),a=J&&r&&r.a,l=J&&r&&r.d,e=Nt&&Dt&&S(Dt),a=(i.clientX-dt.clientX+o.x)/(a||1)+(e?e[0]-xt[0]:0)/(a||1),l=(i.clientY-dt.clientY+o.y)/(l||1)+(e?e[1]-xt[1]:0)/(l||1);if(!Ht.active&&!Et){if(n&&Math.max(Math.abs(i.clientX-this._lastX),Math.abs(i.clientY-this._lastY))<n)return;this._onDragStart(t,!0)}J&&(r?(r.e+=a-(ft||0),r.f+=l-(pt||0)):r={a:1,b:0,c:0,d:1,e:a,f:l},r="matrix(".concat(r.a,",").concat(r.b,",").concat(r.c,",").concat(r.d,",").concat(r.e,",").concat(r.f,")"),R(J,"webkitTransform",r),R(J,"mozTransform",r),R(J,"msTransform",r),R(J,"transform",r),ft=a,pt=l,ht=i),t.cancelable&&t.preventDefault()}},_appendGhost:function(){if(!J){var t=this.options.fallbackOnBody?document.body:tt,e=X($,!0,Nt,!0,t),n=this.options;if(Nt){for(Dt=t;"static"===R(Dt,"position")&&"none"===R(Dt,"transform")&&Dt!==document;)Dt=Dt.parentNode;Dt!==document.body&&Dt!==document.documentElement?(Dt===document&&(Dt=O()),e.top+=Dt.scrollTop,e.left+=Dt.scrollLeft):Dt=O(),xt=S(Dt)}k(J=$.cloneNode(!0),n.ghostClass,!1),k(J,n.fallbackClass,!0),k(J,n.dragClass,!0),R(J,"transition",""),R(J,"transform",""),R(J,"box-sizing","border-box"),R(J,"margin",0),R(J,"top",e.top),R(J,"left",e.left),R(J,"width",e.width),R(J,"height",e.height),R(J,"opacity","0.8"),R(J,"position",Nt?"absolute":"fixed"),R(J,"zIndex","100000"),R(J,"pointerEvents","none"),Ht.ghost=J,t.appendChild(J),R(J,"transform-origin",gt/parseInt(J.style.width)*100+"% "+mt/parseInt(J.style.height)*100+"%")}},_onDragStart:function(t,e){var n=this,o=t.dataTransfer,i=n.options;q("dragStart",this,{evt:t}),Ht.eventCanceled?this._onDrop():(q("setupClone",this),Ht.eventCanceled||((ot=T($)).removeAttribute("id"),ot.draggable=!1,ot.style["will-change"]="",this._hideClone(),k(ot,this.options.chosenClass,!1),Ht.clone=ot),n.cloneId=zt(function(){q("clone",n),Ht.eventCanceled||(n.options.removeCloneOnHide||tt.insertBefore(ot,$),n._hideClone(),Z({sortable:n,name:"clone"}))}),e||k($,i.dragClass,!0),e?(St=!0,n._loopId=setInterval(n._emulateDragOver,50)):(p(document,"mouseup",n._onDrop),p(document,"touchend",n._onDrop),p(document,"touchcancel",n._onDrop),o&&(o.effectAllowed="move",i.setData&&i.setData.call(n,o,$)),f(document,"drop",n),R($,"transform","translateZ(0)")),Et=!0,n._dragStartId=zt(n._dragStarted.bind(n,e,t)),f(document,"selectstart",n),vt=!0,window.getSelection().removeAllRanges(),u&&R(document.body,"user-select","none"))},_onDragOver:function(n){var o,i,r,t,e,a=this.el,l=n.target,s=this.options,c=s.group,u=Ht.active,d=ct===c,h=s.sort,f=ut||u,p=this,g=!1;if(!Ot){if(void 0!==n.preventDefault&&n.cancelable&&n.preventDefault(),l=P(l,s.draggable,a,!0),O("dragOver"),Ht.eventCanceled)return g;if($.contains(n.target)||l.animated&&l.animatingX&&l.animatingY||p._ignoreWhileAnimating===l)return A(!1);if(St=!1,u&&!s.disabled&&(d?h||(i=Q!==tt):ut===this||(this.lastPutMode=ct.checkPull(this,u,$,n))&&c.checkPut(this,u,$,n))){if(r="vertical"===this._getDirection(n,l),o=X($),O("dragOverValid"),Ht.eventCanceled)return g;if(i)return Q=tt,M(),this._hideClone(),O("revert"),Ht.eventCanceled||(et?tt.insertBefore($,et):tt.appendChild($)),A(!0);var m=F(a,s.draggable);if(m&&(S=n,c=r,x=X(F((E=this).el,E.options.draggable)),E=L(E.el,E.options,J),!(c?S.clientX>E.right+10||S.clientY>x.bottom&&S.clientX>x.left:S.clientY>E.bottom+10||S.clientX>x.right&&S.clientY>x.top)||m.animated)){if(m&&(t=n,e=r,C=X(B((_=this).el,0,_.options,!0)),_=L(_.el,_.options,J),e?t.clientX<_.left-10||t.clientY<C.top&&t.clientX<C.right:t.clientY<_.top-10||t.clientY<C.bottom&&t.clientX<C.left)){var v=B(a,0,s,!0);if(v===$)return A(!1);if(D=X(l=v),!1!==Lt(tt,a,$,o,l,D,n,!1))return M(),a.insertBefore($,v),Q=a,N(),A(!0)}else if(l.parentNode===a){var b,y,w,D=X(l),E=$.parentNode!==a,S=(S=$.animated&&$.toRect||o,x=l.animated&&l.toRect||D,_=(e=r)?S.left:S.top,t=e?S.right:S.bottom,C=e?S.width:S.height,v=e?x.left:x.top,S=e?x.right:x.bottom,x=e?x.width:x.height,!(_===v||t===S||_+C/2===v+x/2)),_=r?"top":"left",C=Y(l,"top","top")||Y($,"top","top"),v=C?C.scrollTop:void 0;if(bt!==l&&(y=D[_],Ct=!1,Tt=!S&&s.invertSwap||E),0!==(b=function(t,e,n,o,i,r,a,l){var s=o?t.clientY:t.clientX,c=o?n.height:n.width,t=o?n.top:n.left,o=o?n.bottom:n.right,n=!1;if(!a)if(l&&wt<c*i){if(Ct=!Ct&&(1===yt?t+c*r/2<s:s<o-c*r/2)?!0:Ct)n=!0;else if(1===yt?s<t+wt:o-wt<s)return-yt}else if(t+c*(1-i)/2<s&&s<o-c*(1-i)/2)return function(t){return j($)<j(t)?1:-1}(e);if((n=n||a)&&(s<t+c*r/2||o-c*r/2<s))return t+c/2<s?1:-1;return 0}(n,l,D,r,S?1:s.swapThreshold,null==s.invertedSwapThreshold?s.swapThreshold:s.invertedSwapThreshold,Tt,bt===l)))for(var T=j($);(w=Q.children[T-=b])&&("none"===R(w,"display")||w===J););if(0===b||w===l)return A(!1);yt=b;var x=(bt=l).nextElementSibling,E=!1,S=Lt(tt,a,$,o,l,D,n,E=1===b);if(!1!==S)return 1!==S&&-1!==S||(E=1===S),Ot=!0,setTimeout(Wt,30),M(),E&&!x?a.appendChild($):l.parentNode.insertBefore($,E?x:l),C&&H(C,0,v-C.scrollTop),Q=$.parentNode,void 0===y||Tt||(wt=Math.abs(y-X(l)[_])),N(),A(!0)}}else{if(m===$)return A(!1);if((l=m&&a===n.target?m:l)&&(D=X(l)),!1!==Lt(tt,a,$,o,l,D,n,!!l))return M(),m&&m.nextSibling?a.insertBefore($,m.nextSibling):a.appendChild($),Q=a,N(),A(!0)}if(a.contains($))return A(!1)}return!1}function O(t,e){q(t,p,I({evt:n,isOwner:d,axis:r?"vertical":"horizontal",revert:i,dragRect:o,targetRect:D,canSort:h,fromSortable:f,target:l,completed:A,onMove:function(t,e){return Lt(tt,a,$,o,t,X(t),n,e)},changed:N},e))}function M(){O("dragOverAnimationCapture"),p.captureAnimationState(),p!==f&&f.captureAnimationState()}function A(t){return O("dragOverCompleted",{insertion:t}),t&&(d?u._hideClone():u._showClone(p),p!==f&&(k($,(ut||u).options.ghostClass,!1),k($,s.ghostClass,!0)),ut!==p&&p!==Ht.active?ut=p:p===Ht.active&&ut&&(ut=null),f===p&&(p._ignoreWhileAnimating=l),p.animateAll(function(){O("dragOverAnimationComplete"),p._ignoreWhileAnimating=null}),p!==f&&(f.animateAll(),f._ignoreWhileAnimating=null)),(l===$&&!$.animated||l===a&&!l.animated)&&(bt=null),s.dragoverBubble||n.rootEl||l===document||($.parentNode[K]._isOutsideThisEl(n.target),t||Ft(n)),!s.dragoverBubble&&n.stopPropagation&&n.stopPropagation(),g=!0}function N(){at=j($),st=j($,s.draggable),Z({sortable:p,name:"change",toEl:a,newIndex:at,newDraggableIndex:st,originalEvent:n})}},_ignoreWhileAnimating:null,_offMoveEvents:function(){p(document,"mousemove",this._onTouchMove),p(document,"touchmove",this._onTouchMove),p(document,"pointermove",this._onTouchMove),p(document,"dragover",Ft),p(document,"mousemove",Ft),p(document,"touchmove",Ft)},_offUpEvents:function(){var t=this.el.ownerDocument;p(t,"mouseup",this._onDrop),p(t,"touchend",this._onDrop),p(t,"pointerup",this._onDrop),p(t,"pointercancel",this._onDrop),p(t,"touchcancel",this._onDrop),p(document,"selectstart",this)},_onDrop:function(t){var e=this.el,n=this.options;at=j($),st=j($,n.draggable),q("drop",this,{evt:t}),Q=$&&$.parentNode,at=j($),st=j($,n.draggable),Ht.eventCanceled||(Ct=Tt=Et=!1,clearInterval(this._loopId),clearTimeout(this._dragStartTimer),Gt(this.cloneId),Gt(this._dragStartId),this.nativeDraggable&&(p(document,"drop",this),p(e,"dragstart",this._onDragStart)),this._offMoveEvents(),this._offUpEvents(),u&&R(document.body,"user-select",""),R($,"transform",""),t&&(vt&&(t.cancelable&&t.preventDefault(),n.dropBubble||t.stopPropagation()),J&&J.parentNode&&J.parentNode.removeChild(J),(tt===Q||ut&&"clone"!==ut.lastPutMode)&&ot&&ot.parentNode&&ot.parentNode.removeChild(ot),$&&(this.nativeDraggable&&p($,"dragend",this),Kt($),$.style["will-change"]="",vt&&!Et&&k($,(ut||this).options.ghostClass,!1),k($,this.options.chosenClass,!1),Z({sortable:this,name:"unchoose",toEl:Q,newIndex:null,newDraggableIndex:null,originalEvent:t}),tt!==Q?(0<=at&&(Z({rootEl:Q,name:"add",toEl:Q,fromEl:tt,originalEvent:t}),Z({sortable:this,name:"remove",toEl:Q,originalEvent:t}),Z({rootEl:Q,name:"sort",toEl:Q,fromEl:tt,originalEvent:t}),Z({sortable:this,name:"sort",toEl:Q,originalEvent:t})),ut&&ut.save()):at!==rt&&0<=at&&(Z({sortable:this,name:"update",toEl:Q,originalEvent:t}),Z({sortable:this,name:"sort",toEl:Q,originalEvent:t})),Ht.active&&(null!=at&&-1!==at||(at=rt,st=lt),Z({sortable:this,name:"end",toEl:Q,originalEvent:t}),this.save())))),this._nulling()},_nulling:function(){q("nulling",this),tt=$=Q=J=et=ot=nt=it=dt=ht=vt=at=st=rt=lt=bt=yt=ut=ct=Ht.dragged=Ht.ghost=Ht.clone=Ht.active=null;var e=this.el;Mt.forEach(function(t){e.contains(t)&&(t.checked=!0)}),Mt.length=ft=pt=0},handleEvent:function(t){switch(t.type){case"drop":case"dragend":this._onDrop(t);break;case"dragenter":case"dragover":$&&(this._onDragOver(t),function(t){t.dataTransfer&&(t.dataTransfer.dropEffect="move");t.cancelable&&t.preventDefault()}(t));break;case"selectstart":t.preventDefault()}},toArray:function(){for(var t,e=[],n=this.el.children,o=0,i=n.length,r=this.options;o<i;o++)P(t=n[o],r.draggable,this.el,!1)&&e.push(t.getAttribute(r.dataIdAttr)||function(t){var e=t.tagName+t.className+t.src+t.href+t.textContent,n=e.length,o=0;for(;n--;)o+=e.charCodeAt(n);return o.toString(36)}(t));return e},sort:function(t,e){var n={},o=this.el;this.toArray().forEach(function(t,e){e=o.children[e];P(e,this.options.draggable,o,!1)&&(n[t]=e)},this),e&&this.captureAnimationState(),t.forEach(function(t){n[t]&&(o.removeChild(n[t]),o.appendChild(n[t]))}),e&&this.animateAll()},save:function(){var t=this.options.store;t&&t.set&&t.set(this)},closest:function(t,e){return P(t,e||this.options.draggable,this.el,!1)},option:function(t,e){var n=this.options;if(void 0===e)return n[t];var o=G.modifyOption(this,t,e);n[t]=void 0!==o?o:e,"group"===t&&Xt(n)},destroy:function(){q("destroy",this);var t=this.el;t[K]=null,p(t,"mousedown",this._onTapStart),p(t,"touchstart",this._onTapStart),p(t,"pointerdown",this._onTapStart),this.nativeDraggable&&(p(t,"dragover",this),p(t,"dragenter",this)),Array.prototype.forEach.call(t.querySelectorAll("[draggable]"),function(t){t.removeAttribute("draggable")}),this._onDrop(),this._disableDelayedDragEvents(),_t.splice(_t.indexOf(this.el),1),this.el=t=null},_hideClone:function(){it||(q("hideClone",this),Ht.eventCanceled||(R(ot,"display","none"),this.options.removeCloneOnHide&&ot.parentNode&&ot.parentNode.removeChild(ot),it=!0))},_showClone:function(t){"clone"===t.lastPutMode?it&&(q("showClone",this),Ht.eventCanceled||($.parentNode!=tt||this.options.group.revertClone?et?tt.insertBefore(ot,et):tt.appendChild(ot):tt.insertBefore(ot,$),this.options.group.revertClone&&this.animate($,ot),R(ot,"display",""),it=!1)):this._hideClone()}},At&&f(document,"touchmove",function(t){(Ht.active||Et)&&t.cancelable&&t.preventDefault()}),Ht.utils={on:f,off:p,css:R,find:E,is:function(t,e){return!!P(t,e,t,!1)},extend:function(t,e){if(t&&e)for(var n in e)e.hasOwnProperty(n)&&(t[n]=e[n]);return t},throttle:C,closest:P,toggleClass:k,clone:T,index:j,nextTick:zt,cancelNextTick:Gt,detectDirection:Rt,getChild:B,expando:K},Ht.get=function(t){return t[K]},Ht.mount=function(){for(var t=arguments.length,e=new Array(t),n=0;n<t;n++)e[n]=arguments[n];(e=e[0].constructor===Array?e[0]:e).forEach(function(t){if(!t.prototype||!t.prototype.constructor)throw"Sortable: Mounted plugin must be a constructor function, not ".concat({}.toString.call(t));t.utils&&(Ht.utils=I(I({},Ht.utils),t.utils)),G.mount(t)})},Ht.create=function(t,e){return new Ht(t,e)};var Ut,qt,Vt,Zt,$t,Qt,Jt=[],te=!(Ht.version="1.15.7");function ee(){Jt.forEach(function(t){clearInterval(t.pid)}),Jt=[]}function ne(){clearInterval(Qt)}var oe,ie=C(function(n,t,e,o){if(t.scroll){var i,r=(n.touches?n.touches[0]:n).clientX,a=(n.touches?n.touches[0]:n).clientY,l=t.scrollSensitivity,s=t.scrollSpeed,c=O(),u=!1;qt!==e&&(qt=e,ee(),Ut=t.scroll,i=t.scrollFn,!0===Ut&&(Ut=M(e,!0)));var d=0,h=Ut;do{var f=h,p=X(f),g=p.top,m=p.bottom,v=p.left,b=p.right,y=p.width,w=p.height,D=void 0,E=void 0,S=f.scrollWidth,_=f.scrollHeight,C=R(f),T=f.scrollLeft,p=f.scrollTop,E=f===c?(D=y<S&&("auto"===C.overflowX||"scroll"===C.overflowX||"visible"===C.overflowX),w<_&&("auto"===C.overflowY||"scroll"===C.overflowY||"visible"===C.overflowY)):(D=y<S&&("auto"===C.overflowX||"scroll"===C.overflowX),w<_&&("auto"===C.overflowY||"scroll"===C.overflowY)),T=D&&(Math.abs(b-r)<=l&&T+y<S)-(Math.abs(v-r)<=l&&!!T),p=E&&(Math.abs(m-a)<=l&&p+w<_)-(Math.abs(g-a)<=l&&!!p);if(!Jt[d])for(var x=0;x<=d;x++)Jt[x]||(Jt[x]={});Jt[d].vx==T&&Jt[d].vy==p&&Jt[d].el===f||(Jt[d].el=f,Jt[d].vx=T,Jt[d].vy=p,clearInterval(Jt[d].pid),0==T&&0==p||(u=!0,Jt[d].pid=setInterval(function(){o&&0===this.layer&&Ht.active._onTouchMove($t);var t=Jt[this.layer].vy?Jt[this.layer].vy*s:0,e=Jt[this.layer].vx?Jt[this.layer].vx*s:0;"function"==typeof i&&"continue"!==i.call(Ht.dragged.parentNode[K],e,t,n,$t,Jt[this.layer].el)||H(Jt[this.layer].el,e,t)}.bind({layer:d}),24))),d++}while(t.bubbleScroll&&h!==c&&(h=M(h,!1)));te=u}},30),n=function(t){var e=t.originalEvent,n=t.putSortable,o=t.dragEl,i=t.activeSortable,r=t.dispatchSortableEvent,a=t.hideGhostForTarget,t=t.unhideGhostForTarget;e&&(i=n||i,a(),e=e.changedTouches&&e.changedTouches.length?e.changedTouches[0]:e,e=document.elementFromPoint(e.clientX,e.clientY),t(),i&&!i.el.contains(e)&&(r("spill"),this.onSpill({dragEl:o,putSortable:n})))};function re(){}function ae(){}re.prototype={startIndex:null,dragStart:function(t){t=t.oldDraggableIndex;this.startIndex=t},onSpill:function(t){var e=t.dragEl,n=t.putSortable;this.sortable.captureAnimationState(),n&&n.captureAnimationState();t=B(this.sortable.el,this.startIndex,this.options);t?this.sortable.el.insertBefore(e,t):this.sortable.el.appendChild(e),this.sortable.animateAll(),n&&n.animateAll()},drop:n},a(re,{pluginName:"revertOnSpill"}),ae.prototype={onSpill:function(t){var e=t.dragEl,t=t.putSortable||this.sortable;t.captureAnimationState(),e.parentNode&&e.parentNode.removeChild(e),t.animateAll()},drop:n},a(ae,{pluginName:"removeOnSpill"});var le,se,ce,ue,de,he=[],fe=[],pe=!1,ge=!1,me=!1;function ve(n,o){fe.forEach(function(t,e){e=o.children[t.sortableIndex+(n?Number(e):0)];e?o.insertBefore(t,e):o.appendChild(t)})}function be(){he.forEach(function(t){t!==ce&&t.parentNode&&t.parentNode.removeChild(t)})}return Ht.mount(new function(){function t(){for(var t in this.defaults={scroll:!0,forceAutoScrollFallback:!1,scrollSensitivity:30,scrollSpeed:10,bubbleScroll:!0},this)"_"===t.charAt(0)&&"function"==typeof this[t]&&(this[t]=this[t].bind(this))}return t.prototype={dragStarted:function(t){t=t.originalEvent;this.sortable.nativeDraggable?f(document,"dragover",this._handleAutoScroll):this.options.supportPointer?f(document,"pointermove",this._handleFallbackAutoScroll):t.touches?f(document,"touchmove",this._handleFallbackAutoScroll):f(document,"mousemove",this._handleFallbackAutoScroll)},dragOverCompleted:function(t){t=t.originalEvent;this.options.dragOverBubble||t.rootEl||this._handleAutoScroll(t)},drop:function(){this.sortable.nativeDraggable?p(document,"dragover",this._handleAutoScroll):(p(document,"pointermove",this._handleFallbackAutoScroll),p(document,"touchmove",this._handleFallbackAutoScroll),p(document,"mousemove",this._handleFallbackAutoScroll)),ne(),ee(),clearTimeout(v),v=void 0},nulling:function(){$t=qt=Ut=te=Qt=Vt=Zt=null,Jt.length=0},_handleFallbackAutoScroll:function(t){this._handleAutoScroll(t,!0)},_handleAutoScroll:function(e,n){var o,i=this,r=(e.touches?e.touches[0]:e).clientX,a=(e.touches?e.touches[0]:e).clientY,t=document.elementFromPoint(r,a);$t=e,n||this.options.forceAutoScrollFallback||w||y||u?(ie(e,this.options,t,n),o=M(t,!0),!te||Qt&&r===Vt&&a===Zt||(Qt&&ne(),Qt=setInterval(function(){var t=M(document.elementFromPoint(r,a),!0);t!==o&&(o=t,ee()),ie(e,i.options,t,n)},10),Vt=r,Zt=a)):this.options.bubbleScroll&&M(t,!0)!==O()?ie(e,this.options,M(t,!1),!1):ee()}},a(t,{pluginName:"scroll",initializeByDefault:!0})}),Ht.mount(ae,re),Ht.mount(new function(){function t(){this.defaults={swapClass:"sortable-swap-highlight"}}return t.prototype={dragStart:function(t){t=t.dragEl;oe=t},dragOverValid:function(t){var e=t.completed,n=t.target,o=t.onMove,i=t.activeSortable,r=t.changed,a=t.cancel;i.options.swap&&(t=this.sortable.el,i=this.options,n&&n!==t&&(t=oe,oe=!1!==o(n)?(k(n,i.swapClass,!0),n):null,t&&t!==oe&&k(t,i.swapClass,!1)),r(),e(!0),a())},drop:function(t){var e,n,o=t.activeSortable,i=t.putSortable,r=t.dragEl,a=i||this.sortable,l=this.options;oe&&k(oe,l.swapClass,!1),oe&&(l.swap||i&&i.options.swap)&&r!==oe&&(a.captureAnimationState(),a!==o&&o.captureAnimationState(),n=oe,t=(e=r).parentNode,l=n.parentNode,t&&l&&!t.isEqualNode(n)&&!l.isEqualNode(e)&&(i=j(e),r=j(n),t.isEqualNode(l)&&i<r&&r++,t.insertBefore(n,t.children[i]),l.insertBefore(e,l.children[r])),a.animateAll(),a!==o&&o.animateAll())},nulling:function(){oe=null}},a(t,{pluginName:"swap",eventProperties:function(){return{swapItem:oe}}})}),Ht.mount(new function(){function t(o){for(var t in this)"_"===t.charAt(0)&&"function"==typeof this[t]&&(this[t]=this[t].bind(this));o.options.avoidImplicitDeselect||(o.options.supportPointer?f(document,"pointerup",this._deselectMultiDrag):(f(document,"mouseup",this._deselectMultiDrag),f(document,"touchend",this._deselectMultiDrag))),f(document,"keydown",this._checkKeyDown),f(document,"keyup",this._checkKeyUp),this.defaults={selectedClass:"sortable-selected",multiDragKey:null,avoidImplicitDeselect:!1,setData:function(t,e){var n="";he.length&&se===o?he.forEach(function(t,e){n+=(e?", ":"")+t.textContent}):n=e.textContent,t.setData("Text",n)}}}return t.prototype={multiDragKeyDown:!1,isMultiDrag:!1,delayStartGlobal:function(t){t=t.dragEl;ce=t},delayEnded:function(){this.isMultiDrag=~he.indexOf(ce)},setupClone:function(t){var e=t.sortable,t=t.cancel;if(this.isMultiDrag){for(var n=0;n<he.length;n++)fe.push(T(he[n])),fe[n].sortableIndex=he[n].sortableIndex,fe[n].draggable=!1,fe[n].style["will-change"]="",k(fe[n],this.options.selectedClass,!1),he[n]===ce&&k(fe[n],this.options.chosenClass,!1);e._hideClone(),t()}},clone:function(t){var e=t.sortable,n=t.rootEl,o=t.dispatchSortableEvent,t=t.cancel;this.isMultiDrag&&(this.options.removeCloneOnHide||he.length&&se===e&&(ve(!0,n),o("clone"),t()))},showClone:function(t){var e=t.cloneNowShown,n=t.rootEl,t=t.cancel;this.isMultiDrag&&(ve(!1,n),fe.forEach(function(t){R(t,"display","")}),e(),de=!1,t())},hideClone:function(t){var e=this,n=(t.sortable,t.cloneNowHidden),t=t.cancel;this.isMultiDrag&&(fe.forEach(function(t){R(t,"display","none"),e.options.removeCloneOnHide&&t.parentNode&&t.parentNode.removeChild(t)}),n(),de=!0,t())},dragStartGlobal:function(t){t.sortable;!this.isMultiDrag&&se&&se.multiDrag._deselectMultiDrag(),he.forEach(function(t){t.sortableIndex=j(t)}),he=he.sort(function(t,e){return t.sortableIndex-e.sortableIndex}),me=!0},dragStarted:function(t){var e,n=this,t=t.sortable;this.isMultiDrag&&(this.options.sort&&(t.captureAnimationState(),this.options.animation&&(he.forEach(function(t){t!==ce&&R(t,"position","absolute")}),e=X(ce,!1,!0,!0),he.forEach(function(t){t!==ce&&x(t,e)}),pe=ge=!0)),t.animateAll(function(){pe=ge=!1,n.options.animation&&he.forEach(function(t){A(t)}),n.options.sort&&be()}))},dragOver:function(t){var e=t.target,n=t.completed,t=t.cancel;ge&&~he.indexOf(e)&&(n(!1),t())},revert:function(t){var n,o,e=t.fromSortable,i=t.rootEl,r=t.sortable,a=t.dragRect;1<he.length&&(he.forEach(function(t){r.addAnimationState({target:t,rect:ge?X(t):a}),A(t),t.fromRect=a,e.removeAnimationState(t)}),ge=!1,n=!this.options.removeCloneOnHide,o=i,he.forEach(function(t,e){e=o.children[t.sortableIndex+(n?Number(e):0)];e?o.insertBefore(t,e):o.appendChild(t)}))},dragOverCompleted:function(t){var e,n=t.sortable,o=t.isOwner,i=t.insertion,r=t.activeSortable,a=t.parentEl,l=t.putSortable,t=this.options;i&&(o&&r._hideClone(),pe=!1,t.animation&&1<he.length&&(ge||!o&&!r.options.sort&&!l)&&(e=X(ce,!1,!0,!0),he.forEach(function(t){t!==ce&&(x(t,e),a.appendChild(t))}),ge=!0),o||(ge||be(),1<he.length?(o=de,r._showClone(n),r.options.animation&&!de&&o&&fe.forEach(function(t){r.addAnimationState({target:t,rect:ue}),t.fromRect=ue,t.thisAnimationDuration=null})):r._showClone(n)))},dragOverAnimationCapture:function(t){var e=t.dragRect,n=t.isOwner,t=t.activeSortable;he.forEach(function(t){t.thisAnimationDuration=null}),t.options.animation&&!n&&t.multiDrag.isMultiDrag&&(ue=a({},e),e=D(ce,!0),ue.top-=e.f,ue.left-=e.e)},dragOverAnimationComplete:function(){ge&&(ge=!1,be())},drop:function(t){var o,i,r,a,n,e,l,s=t.originalEvent,c=t.rootEl,u=t.parentEl,d=t.sortable,h=t.dispatchSortableEvent,f=t.oldIndex,t=t.putSortable,p=t||this.sortable;s&&(o=this.options,i=u.children,me||(o.multiDragKey&&!this.multiDragKeyDown&&this._deselectMultiDrag(),k(ce,o.selectedClass,!~he.indexOf(ce)),~he.indexOf(ce)?(he.splice(he.indexOf(ce),1),le=null,U({sortable:d,rootEl:c,name:"deselect",targetEl:ce,originalEvent:s})):(he.push(ce),U({sortable:d,rootEl:c,name:"select",targetEl:ce,originalEvent:s}),s.shiftKey&&le&&d.el.contains(le)?(r=j(le),a=j(ce),~r&&~a&&r!==a&&function(){for(var e,t=r<a?(e=r,a):(e=a,r+1),n=o.filter;e<t;e++)~he.indexOf(i[e])||P(i[e],o.draggable,u,!1)&&(n&&("function"==typeof n?n.call(d,s,i[e],d):n.split(",").some(function(t){return P(i[e],t.trim(),u,!1)}))||(k(i[e],o.selectedClass,!0),he.push(i[e]),U({sortable:d,rootEl:c,name:"select",targetEl:i[e],originalEvent:s})))}()):le=ce,se=p)),me&&this.isMultiDrag&&(ge=!1,(u[K].options.sort||u!==c)&&1<he.length&&(n=X(ce),e=j(ce,":not(."+this.options.selectedClass+")"),!pe&&o.animation&&(ce.thisAnimationDuration=null),p.captureAnimationState(),pe||(o.animation&&(ce.fromRect=n,he.forEach(function(t){var e;t.thisAnimationDuration=null,t!==ce&&(e=ge?X(t):n,t.fromRect=e,p.addAnimationState({target:t,rect:e}))})),be(),he.forEach(function(t){i[e]?u.insertBefore(t,i[e]):u.appendChild(t),e++}),f===j(ce)&&(l=!1,he.forEach(function(t){t.sortableIndex!==j(t)&&(l=!0)}),l&&(h("update"),h("sort")))),he.forEach(function(t){A(t)}),p.animateAll()),se=p),(c===u||t&&"clone"!==t.lastPutMode)&&fe.forEach(function(t){t.parentNode&&t.parentNode.removeChild(t)}))},nullingGlobal:function(){this.isMultiDrag=me=!1,fe.length=0},destroyGlobal:function(){this._deselectMultiDrag(),p(document,"pointerup",this._deselectMultiDrag),p(document,"mouseup",this._deselectMultiDrag),p(document,"touchend",this._deselectMultiDrag),p(document,"keydown",this._checkKeyDown),p(document,"keyup",this._checkKeyUp)},_deselectMultiDrag:function(t){if(!(void 0!==me&&me||se!==this.sortable||t&&P(t.target,this.options.draggable,this.sortable.el,!1)||t&&0!==t.button))for(;he.length;){var e=he[0];k(e,this.options.selectedClass,!1),he.shift(),U({sortable:this.sortable,rootEl:this.sortable.el,name:"deselect",targetEl:e,originalEvent:t})}},_checkKeyDown:function(t){t.key===this.options.multiDragKey&&(this.multiDragKeyDown=!0)},_checkKeyUp:function(t){t.key===this.options.multiDragKey&&(this.multiDragKeyDown=!1)}},a(t,{pluginName:"multiDrag",utils:{select:function(t){var e=t.parentNode[K];e&&e.options.multiDrag&&!~he.indexOf(t)&&(se&&se!==e&&(se.multiDrag._deselectMultiDrag(),se=e),k(t,e.options.selectedClass,!0),he.push(t))},deselect:function(t){var e=t.parentNode[K],n=he.indexOf(t);e&&e.options.multiDrag&&~n&&(k(t,e.options.selectedClass,!1),he.splice(n,1))}},eventProperties:function(){var n=this,o=[],i=[];return he.forEach(function(t){var e;o.push({multiDragElement:t,index:t.sortableIndex}),e=ge&&t!==ce?-1:ge?j(t,":not(."+n.options.selectedClass+")"):j(t),i.push({multiDragElement:t,index:e})}),{items:e(he),clones:[].concat(fe),oldIndicies:o,newIndicies:i}},optionListeners:{multiDragKey:function(t){return"ctrl"===(t=t.toLowerCase())?t="Control":1<t.length&&(t=t.charAt(0).toUpperCase()+t.substr(1)),t}}})}),Ht});


const EXT_ID = "preset-editor";
const LABEL = "预设编辑器";

// ----- 运行时依赖(动态加载，失败也不会让扩展崩溃) -----
let _oai = null;            // oai_settings
let _promptManager = null;  // promptManager 实例
let _getPresetManager = null;
let _saveSettingsDebounced = null;
let _extSettings = {};
let _callGenericPopup = null;
let _POPUP_TYPE = null;

// 工作副本(编辑中的状态，未应用前不写回真实设置)
let state = {
    prompts: [],   // 提示词对象数组(深拷贝)
    order: [],     // 当前角色的排序 [{identifier, enabled}]
    search: "",
    expanded: new Set(),
    benchLeft: null, // 缝合台左侧来源（预设或世界书）
};

// 角色显示
const ROLE_LABEL = { system: "系统", user: "用户", assistant: "AI" };
const ROLE_COLOR = { system: "#8b5cf6", user: "#3b82f6", assistant: "#10b981" };

// 已知占位符(marker)中文名,用于教程和预览友好显示
const MARKER_NAMES = {
    main: "主提示词",
    nsfw: "辅助提示词(NSFW)",
    jailbreak: "历史后指令(越狱/Post-History)",
    enhanceDefinitions: "增强定义",
    charDescription: "角色描述",
    charPersonality: "角色性格",
    scenario: "场景",
    personaDescription: "用户角色(persona)描述",
    dialogueExamples: "对话示例",
    chatHistory: "聊天记录",
    worldInfoBefore: "世界书(前置)",
    worldInfoAfter: "世界书(后置)",
};

// =====================================================================
// 依赖获取(尽量兼容多个版本)
// =====================================================================
async function loadDeps() {
    const ctx = safeCtx();

    // oai_settings
    try {
        const m = await import("../../../openai.js");
        _oai = m.oai_settings ?? _oai;
        _promptManager = m.promptManager ?? _promptManager;
    } catch (e) {
        console.warn(`[${EXT_ID}] 无法 import openai.js，改用 context 回退`, e);
    }
    if (!_oai) _oai = ctx?.chatCompletionSettings ?? window.oai_settings ?? null;
    if (!_promptManager) _promptManager = ctx?.promptManager ?? window.promptManager ?? null;

    // preset manager
    if (typeof ctx?.getPresetManager === "function") {
        _getPresetManager = ctx.getPresetManager;
    } else {
        try {
            const pm = await import("../../../preset-manager.js");
            _getPresetManager = pm.getPresetManager ?? null;
        } catch (e) {
            console.warn(`[${EXT_ID}] 无法 import preset-manager.js`, e);
        }
    }

    _saveSettingsDebounced = ctx?.saveSettingsDebounced ?? window.saveSettingsDebounced ?? (() => {});

    // 原生弹窗接口（用它承载 UI，移动端适配/滚动/层级由酒馆官方处理）
    _callGenericPopup = ctx?.callGenericPopup ?? null;
    _POPUP_TYPE = ctx?.POPUP_TYPE ?? null;
    if (!_callGenericPopup || !_POPUP_TYPE) {
        try {
            const p = await import("../../../popup.js");
            _callGenericPopup = _callGenericPopup || p.callGenericPopup;
            _POPUP_TYPE = _POPUP_TYPE || p.POPUP_TYPE;
        } catch (e) { console.warn(`[${EXT_ID}] 无法加载 popup.js`, e); }
    }

    // 扩展设置（用于记住主题选择）
    _extSettings = ctx?.extensionSettings ?? window.extension_settings ?? {};
    if (!_extSettings[EXT_ID] || typeof _extSettings[EXT_ID] !== "object") _extSettings[EXT_ID] = {};
}

// ----- 主题 -----
const THEMES = ["obsidian", "manuscript", "platinum", "sakura", "evergreen", "inkwash", "crimson", "nebula", "daylight"];
const THEME_ACCENT = { obsidian:"#d8b46a", manuscript:"#c79a55", platinum:"#b8c2d4", sakura:"#e79ab4", evergreen:"#6fca9f", inkwash:"#7fb3c4", crimson:"#e08a76", nebula:"#b49ae6", daylight:"#5b7fb0" };
function getSavedTheme() {
    const t = _extSettings?.[EXT_ID]?.theme;
    return THEMES.includes(t) ? t : "obsidian";
}
function applyTheme(name) {
    if (!THEMES.includes(name)) name = "obsidian";
    const modal = document.getElementById("pe-modal");
    if (modal) modal.setAttribute("data-pe-theme", name);
    const sel = document.getElementById("pe-theme-sel"); if (sel) sel.value = name;
    const cur = document.getElementById("pe-theme-cur"); if (cur) cur.style.background = THEME_ACCENT[name] || "#888";
    if (_extSettings && _extSettings[EXT_ID]) { _extSettings[EXT_ID].theme = name; _saveSettingsDebounced?.(); }
}

// 角色 -> 工具类后缀（assistant 缩写为 asst）
function roleKey(role) { return role === "user" ? "user" : role === "assistant" ? "asst" : "system"; }

function safeCtx() {
    try { return getContext?.() ?? window.SillyTavern?.getContext?.() ?? null; }
    catch { return null; }
}

function getOai() {
    if (_oai) return _oai;
    const ctx = safeCtx();
    return ctx?.chatCompletionSettings ?? window.oai_settings ?? null;
}

// 找到「当前生效」的排序条目。优先用 promptManager 的当前角色，回退到全局虚拟角色(100001)。
function getActiveOrderRef(oai) {
    const po = oai?.prompt_order;
    if (!Array.isArray(po) || po.length === 0) return null;

    let charId = null;
    try {
        if (_promptManager?.activeCharacter?.id !== undefined) charId = _promptManager.activeCharacter.id;
    } catch { /* ignore */ }
    if (charId === null) {
        const ctx = safeCtx();
        if (ctx && ctx.characterId !== undefined && ctx.characterId !== null) charId = ctx.characterId;
    }

    let entry = null;
    if (charId !== null) entry = po.find(e => String(e.character_id) === String(charId));
    if (!entry) entry = po.find(e => String(e.character_id) === "100001"); // 全局虚拟角色
    if (!entry) entry = po.find(e => Array.isArray(e.order) && e.order.length); // 取第一个有内容的
    if (!entry) entry = po[po.length - 1];
    return entry || null;
}

// =====================================================================
// 状态：从真实设置载入工作副本 / 写回
// =====================================================================
function loadStateFromLive() {
    const oai = getOai();
    if (!oai || !Array.isArray(oai.prompts)) {
        toast("error", "未找到聊天补全预设数据。请确认当前 API 已切到 Chat Completion 模式。");
        return false;
    }
    const orderRef = getActiveOrderRef(oai);
    state.prompts = deepClone(oai.prompts);
    state.order = orderRef ? deepClone(orderRef.order) : [];
    state.expanded = new Set();
    return true;
}

function applyToLive() {
    const oai = getOai();
    if (!oai) { toast("error", "无法写回：未找到预设数据。"); return false; }

    // 就地替换 prompts 数组内容(保持原数组引用，避免 promptManager 持有旧引用)
    if (!Array.isArray(oai.prompts)) oai.prompts = [];
    oai.prompts.length = 0;
    state.prompts.forEach(p => oai.prompts.push(deepClone(p)));

    // 写回排序
    const orderRef = getActiveOrderRef(oai);
    if (orderRef) {
        orderRef.order.length = 0;
        state.order.forEach(o => orderRef.order.push(deepClone(o)));
    }

    // 刷新 UI + 持久化当前设置
    try { _promptManager?.render?.(); } catch (e) { console.warn(e); }
    try {
        if (typeof _promptManager?.saveServiceSettings === "function") _promptManager.saveServiceSettings();
        else _saveSettingsDebounced?.();
    } catch (e) { console.warn(e); _saveSettingsDebounced?.(); }
    return true;
}

async function saveToPreset() {
    if (!applyToLive()) return;
    const name = getCurrentPresetName();

    // 1) 首选：用预设管理器把整份预设写入文件
    if (typeof _getPresetManager === "function") {
        try {
            const pm = _getPresetManager("openai");
            const nm = name || getCurrentPresetName(pm);
            if (pm && typeof pm.savePreset === "function" && nm) {
                await pm.savePreset(nm, deepClone(getOai()));
                toast("success", `已保存到预设「${nm}」并生效。`);
                return;
            }
        } catch (e) {
            console.warn(`[${EXT_ID}] savePreset 失败，改用原生保存按钮`, e);
        }
    }

    // 2) 回退：触发 SillyTavern 原生「保存/更新当前预设」按钮（改动已应用，点它即可落盘）
    if (clickNativeSave()) {
        toast("success", `已保存到预设${name ? `「${name}」` : ""}并生效。`);
        return;
    }

    // 3) 兜底：已生效，提示手动保存
    toast("info", "改动已在当前会话生效。请再点 SillyTavern 预设栏的保存按钮写入文件。");
}

// 尝试点击 ST 原生的「保存/更新当前预设」按钮（仅点保存类，安全）
function clickNativeSave() {
    const selectors = ["#update_oai_preset", "#preset_save_button_openai", "[data-preset-manager-update=\"openai\"]"];
    for (const s of selectors) {
        const el = document.querySelector(s);
        if (el) { try { el.click(); return true; } catch { /* ignore */ } }
    }
    return false;
}

function getCurrentPresetName(pm) {
    try {
        if (typeof pm?.getSelectedPresetName === "function") return pm.getSelectedPresetName();
    } catch { /* ignore */ }
    try {
        if (typeof _getPresetManager === "function") {
            const m = _getPresetManager("openai");
            if (typeof m?.getSelectedPresetName === "function") return m.getSelectedPresetName();
        }
    } catch { /* ignore */ }
    // 回退：读取原生下拉框选中项
    const sel = document.querySelector("#settings_preset_openai");
    if (sel && sel.selectedOptions?.length) return sel.selectedOptions[0].textContent?.trim();
    return null;
}

// =====================================================================
// 工具函数
// =====================================================================
function deepClone(o) {
    try { return structuredClone(o); }
    catch { return JSON.parse(JSON.stringify(o)); }
}
function uuid() {
    if (crypto?.randomUUID) return crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0, v = c === "x" ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
function esc(s) {
    return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function toast(type, msg) {
    try { window.toastr?.[type]?.(msg, LABEL); }
    catch { console.log(`[${EXT_ID}] ${type}: ${msg}`); }
}
function findPrompt(identifier) {
    return state.prompts.find(p => p.identifier === identifier);
}
function isMarker(p) { return !!(p && p.marker); }
function isAbsolute(p) { return Number(p?.injection_position) === 1; }
function displayName(p) {
    if (!p) return "(未知条目)";
    if (p.name) return p.name;
    if (MARKER_NAMES[p.identifier]) return MARKER_NAMES[p.identifier];
    return p.identifier || "(未命名)";
}
function roughTokens(text) {
    const s = String(text ?? "");
    if (!s) return 0;
    // 粗略估算：CJK 约 1 token/字，其他约 1 token/3.5 字
    let cjk = (s.match(/[\u3000-\u9fff\uff00-\uffef]/g) || []).length;
    let other = s.length - cjk;
    return Math.ceil(cjk + other / 3.5);
}

// 真实分词:接 SillyTavern 的分词器，失败则回退到粗略估算
let _tokenCounter = null;   // async (text) => number
let _tokModeReal = false;
async function loadTokenizer() {
    try {
        const m = await import("../../../tokenizers.js");
        if (typeof m.getTokenCountAsync === "function") {
            _tokenCounter = (t) => m.getTokenCountAsync(t);
            _tokModeReal = true;
        } else if (typeof m.getTokenCount === "function") {
            _tokenCounter = async (t) => m.getTokenCount(t);
            _tokModeReal = true;
        }
    } catch (e) {
        console.warn(`[${EXT_ID}] 未能加载分词器，使用估算`, e);
    }
}
async function countTokens(text) {
    const s = String(text ?? "");
    if (!s) return 0;
    if (_tokenCounter) {
        try { const n = await _tokenCounter(s); if (Number.isFinite(n)) return n; } catch { /* fall through */ }
    }
    return roughTokens(s);
}
// 按内容缓存真实 token，避免重复分词
const _tokCache = new Map();
async function countTokensCached(text) {
    const s = String(text ?? "");
    if (!s) return 0;
    if (_tokCache.has(s)) return _tokCache.get(s);
    const n = await countTokens(s);
    _tokCache.set(s, n);
    if (_tokCache.size > 600) _tokCache.delete(_tokCache.keys().next().value);
    return n;
}
function fmtNum(n) { return Number(n || 0).toLocaleString("en-US"); }

// =====================================================================
// 主弹窗
// =====================================================================
// ===================== 缝合台（双栏拖拽）+ 放大编辑 =====================
const _benchExpL = new Set();
let _sortBL = null, _sortBR = null, _benchFI = null;

function wiToPrompt(en) {
    const isDepth = (en.position === 4);
    const role = en.role === 1 ? "user" : (en.role === 2 ? "assistant" : "system");
    const title = en.comment || (Array.isArray(en.key) && en.key.length ? en.key.join(", ") : "") || "世界书条目";
    return {
        identifier: uuid(), name: title, role, content: en.content || "",
        system_prompt: true, marker: false,
        injection_position: isDepth ? 1 : 0, injection_depth: (en.depth != null ? en.depth : 4),
        injection_order: (en.order != null ? en.order : 100), forbid_overrides: false, _wi: true,
    };
}

function benchLoadSource(obj) {
    // 世界书（World Info）：有 entries、没有 prompts → 转成可缝的条目
    if (obj && obj.entries && !obj.prompts) {
        const raw = obj.entries; const arr = Array.isArray(raw) ? raw : Object.values(raw || {});
        if (!arr.length) { toast("error", "这个世界书里没有条目。"); return; }
        const list = arr.map(en => { const p = wiToPrompt(en); p._sid = uuid(); p._enabled = !en.disable; return p; });
        state.benchLeft = { name: obj.name || "世界书", list, wi: true };
        _benchExpL.clear(); renderBench(); toast("success", `已载入世界书：${list.length} 条，可拖到右侧缝进当前预设。`); return;
    }
    const prompts = Array.isArray(obj.prompts) ? obj.prompts : (Array.isArray(obj) ? obj : null);
    if (!prompts) { toast("error", "来源里没找到 prompts 或 entries，请确认是聊天补全预设或世界书。"); return; }
    const map = {}; prompts.forEach(p => { if (p && p.identifier) map[p.identifier] = p; });
    let order; const po = obj.prompt_order;
    if (Array.isArray(po) && po.length) { let bi = 0; po.forEach((e, i) => { if ((e.order?.length || 0) > (po[bi].order?.length || 0)) bi = i; }); order = po[bi].order || []; }
    else order = prompts.map(p => ({ identifier: p.identifier, enabled: p.enabled !== false }));
    const list = []; const seen = {};
    order.forEach(o => { if (map[o.identifier]) { const p = deepClone(map[o.identifier]); p._sid = uuid(); p._enabled = o.enabled !== false; list.push(p); seen[o.identifier] = 1; } });
    prompts.forEach(p => { if (p && p.identifier && !seen[p.identifier]) { const c = deepClone(p); c._sid = uuid(); c._enabled = false; list.push(c); } });
    state.benchLeft = { name: obj.name || "未命名预设", list };
    _benchExpL.clear(); renderBench(); toast("success", `已载入来源：${list.length} 条。`);
}

function benchFileInput() {
    if (_benchFI) return _benchFI;
    _benchFI = document.createElement("input"); _benchFI.type = "file"; _benchFI.accept = "application/json,.json"; _benchFI.style.display = "none";
    _benchFI.addEventListener("change", e => {
        const f = e.target.files[0]; if (!f) return; const r = new FileReader();
        r.onload = () => { try { benchLoadSource(JSON.parse(r.result)); } catch (err) { toast("error", "JSON 解析失败：" + err.message); } };
        r.readAsText(f); e.target.value = "";
    });
    document.body.appendChild(_benchFI); return _benchFI;
}

function dwrapLeft(p) {
    const rc = roleKey(p.role); const marker = isMarker(p); const tok = marker ? 0 : roughTokens(p.content || ""); const ex = _benchExpL.has(p._sid);
    return `<div class="pe-dwrap" data-sid="${esc(p._sid)}">
      <div class="pe-dcard" data-vl="${esc(p._sid)}">
        <span class="pe-grip">⠿</span><span class="pe-role pe-bg-${rc}">${ROLE_LABEL[p.role] || "系统"}</span>
        <span class="pe-dname">${p._wi ? "📖 " : ""}${esc(displayName(p))}</span>
        <span class="pe-dmeta">${marker ? "占位符" : "≈" + fmtNum(tok) + "t"}</span>
        <button class="pe-mini" data-vlb="${esc(p._sid)}" title="查看内容">${ex ? "▲" : "👁"}</button>
      </div>${ex ? `<div class="pe-dedit"><div style="white-space:pre-wrap;font-family:var(--pe-mono);font-size:12px;line-height:1.6;color:var(--pe-sub);max-height:170px;overflow:auto">${esc(p.content || "(空)")}</div><div><button class="pe-maxi-btn" data-vmax="${esc(p._sid)}">⛶ 放大查看</button></div></div>` : ""}</div>`;
}

function dwrapRight(o, i) {
    const p = findPrompt(o.identifier); if (!p) return ""; const rc = roleKey(p.role); const marker = isMarker(p); const tok = marker ? 0 : roughTokens(p.content || "");
    return `<div class="pe-dwrap ${o.enabled ? "" : "pe-disabled"}" data-oid="${i}">
      <div class="pe-dcard">
        <span class="pe-grip">⠿</span><span class="pe-role pe-bg-${rc}">${ROLE_LABEL[p.role] || "系统"}</span>
        <span class="pe-dname">${esc(displayName(p))}</span>
        <span class="pe-dmeta">${marker ? "占位符" : "≈" + fmtNum(tok) + "t"}</span>
        <button class="pe-mini" data-rt="${i}" title="${o.enabled ? "停用" : "启用"}">${o.enabled ? "◉" : "○"}</button>
        <button class="pe-mini pe-del" data-rd="${i}" title="移除">✕</button>
      </div></div>`;
}

function renderBench() {
    const pane = document.querySelector('.pe-pane[data-pane="bench"]'); if (!pane) return;
    const left = state.benchLeft;
    const leftBody = left
        ? (left.list.length ? left.list.map(dwrapLeft).join("") : `<div class="pe-col-empty">这个来源没有条目。</div>`)
        : `<div class="pe-col-empty">载入另一个<b>预设</b>，或一本<b>世界书</b>，把里面的条目拖到右侧当前预设。<br><br><button class="pe-btn pe-btn-primary" id="pe-bench-load" style="display:inline-flex">选择 预设 / 世界书 JSON</button></div>`;
    const rightBody = state.order.length ? state.order.map((o, i) => dwrapRight(o, i)).join("") : `<div class="pe-col-empty">当前预设暂无条目。</div>`;
    pane.innerHTML = `
      <div class="pe-bench-hint">↔ 拖左侧条目的 ⠿ 手柄放到右侧任意位置即可缝入当前预设；世界书条目会自动转成提示词。右侧可上下拖动改顺序。缝完记得点底部「保存」写回预设。</div>
      <div class="pe-bench">
        <div class="pe-col"><div class="pe-col-head"><span class="t">来源（左）${left && left.wi ? " · 📖世界书" : ""}</span><span class="c">${left ? esc(left.name) + " · " + left.list.length + " 条" : "未载入"}</span><span style="flex:1"></span>${left ? `<button class="pe-mini" id="pe-bench-load" title="换来源">⇪</button>` : ""}</div>
          <div class="pe-col-list" id="pe-bench-left">${leftBody}</div></div>
        <div class="pe-col"><div class="pe-col-head"><span class="t">当前预设（右）</span><span class="c">${state.order.length} 条</span></div>
          <div class="pe-col-list" id="pe-bench-right">${rightBody}</div></div>
      </div>`;
    pane.querySelector("#pe-bench-load")?.addEventListener("click", () => benchFileInput().click());
    pane.querySelectorAll("[data-rt]").forEach(b => b.addEventListener("click", e => { e.stopPropagation(); const i = +b.dataset.rt; state.order[i].enabled = !state.order[i].enabled; renderBench(); }));
    pane.querySelectorAll("[data-rd]").forEach(b => b.addEventListener("click", e => { e.stopPropagation(); const i = +b.dataset.rd; state.order.splice(i, 1); renderBench(); }));
    const togV = s => { _benchExpL.has(s) ? _benchExpL.delete(s) : _benchExpL.add(s); renderBench(); };
    pane.querySelectorAll("[data-vlb]").forEach(b => b.addEventListener("click", e => { e.stopPropagation(); togV(b.dataset.vlb); }));
    pane.querySelectorAll("[data-vl]").forEach(h => h.addEventListener("click", e => { if (e.target.closest(".pe-grip,button")) return; togV(h.dataset.vl); }));
    pane.querySelectorAll("[data-vmax]").forEach(b => b.addEventListener("click", e => { e.stopPropagation(); const p = state.benchLeft?.list.find(x => x._sid === b.dataset.vmax); if (p) openMaxi(p, null, true); }));
    initBenchSort();
}

function initBenchSort() {
    const S = globalThis.Sortable; if (!S) return;
    const L = document.getElementById("pe-bench-left"), R = document.getElementById("pe-bench-right");
    if (_sortBL) { try { _sortBL.destroy(); } catch (_) {} _sortBL = null; }
    if (_sortBR) { try { _sortBR.destroy(); } catch (_) {} _sortBR = null; }
    const common = { handle: ".pe-grip", animation: 150, forceFallback: true, fallbackOnBody: true, fallbackTolerance: 5, scroll: true };
    if (L && state.benchLeft) _sortBL = new S(L, Object.assign({}, common, { group: { name: "peb", pull: "clone", put: false }, sort: false }));
    if (R) _sortBR = new S(R, Object.assign({}, common, { group: { name: "peb", pull: false, put: true }, onAdd: onBenchAdd, onUpdate: onBenchUpdate }));
}

function onBenchAdd(evt) {
    const sid = evt.item.getAttribute("data-sid"); const at = evt.newIndex;
    if (evt.item.parentNode) evt.item.parentNode.removeChild(evt.item);
    const src = state.benchLeft && state.benchLeft.list.find(p => p._sid === sid);
    if (!src) { renderBench(); return; }
    let entry = null, skip = false;
    if (isMarker(src)) {
        if (findPrompt(src.identifier)) skip = true;
        else { const c = deepClone(src); delete c._sid; delete c._enabled; delete c._wi; state.prompts.push(c); entry = { identifier: src.identifier, enabled: true }; }
    } else {
        const c = deepClone(src); delete c._sid; delete c._enabled; delete c._wi; c.identifier = uuid(); state.prompts.push(c); entry = { identifier: c.identifier, enabled: true };
    }
    if (entry) { state.order.splice(Math.max(0, Math.min(at, state.order.length)), 0, entry); toast("success", "已缝入：" + displayName(src)); }
    else if (skip) { toast("info", "跳过重复占位符：" + displayName(src)); }
    renderBench();
}
function onBenchUpdate(evt) {
    const from = evt.oldIndex, to = evt.newIndex;
    if (from == null || to == null || from === to) { renderBench(); return; }
    const [m] = state.order.splice(from, 1); state.order.splice(to, 0, m); renderBench();
}

function openMaxi(tgt, smallTa, readonly) {
    const host = document.querySelector(".pe-host") || document.body;
    const ov = document.createElement("div"); ov.className = "pe-ov"; ov.id = "pe-maxi";
    ov.innerHTML = `<div class="pe-ov-card">
        <div class="pe-ov-head"><h3>✎ 内容 · ${esc(displayName(tgt))}</h3>
          <span id="pe-maxi-ct" style="font-family:var(--pe-mono);font-size:12px;color:var(--pe-faint)"></span>
          <button class="pe-btn pe-btn-icon" id="pe-maxi-x" title="关闭">✕</button></div>
        <div class="pe-ov-body"><textarea id="pe-maxi-ta" spellcheck="false" ${readonly ? "readonly" : ""}></textarea></div>
        <div class="pe-ov-foot"><span style="color:var(--pe-faint);font-size:12px">${readonly ? "仅查看" : "编辑会实时同步回条目"}</span><span style="flex:1"></span>
          <button class="pe-btn pe-btn-primary" id="pe-maxi-done">完成</button></div></div>`;
    host.appendChild(ov);
    const ta = ov.querySelector("#pe-maxi-ta"); ta.value = tgt.content || "";
    const ct = ov.querySelector("#pe-maxi-ct"); const upd = () => { ct.textContent = fmtNum(ta.value.length) + " 字 · ≈" + fmtNum(roughTokens(ta.value)) + " t"; }; upd();
    if (!readonly) ta.addEventListener("input", () => { if (smallTa) { smallTa.value = ta.value; smallTa.dispatchEvent(new Event("input")); } else { tgt.content = ta.value; } upd(); });
    const close = () => ov.remove();
    ov.querySelector("#pe-maxi-x").addEventListener("click", close);
    ov.querySelector("#pe-maxi-done").addEventListener("click", close);
    ov.addEventListener("click", e => { if (e.target === ov) close(); });
    setTimeout(() => ta.focus(), 30);
}

function openEditor() {
    if (document.getElementById("pe-modal")) return; // 已打开
    if (typeof _callGenericPopup !== "function" || !_POPUP_TYPE) {
        toast("error", "未找到 SillyTavern 弹窗接口，无法打开编辑器。");
        return;
    }
    if (!loadStateFromLive()) return;

    // 关键：把 UI 装进酒馆原生弹窗（callGenericPopup）。原生弹窗基于 <dialog>，
    // 其层级、滚动、尺寸、移动端适配都由酒馆官方处理，能绕开自定义浮层在手机上的
    // 各种坑（滑动乱跳、尺寸失控、被 transform 容器困住等）。
    const overlay = document.createElement("div"); // 作为 popup 内容根节点（沿用 #pe-modal 样式）
    overlay.id = "pe-modal";
    overlay.setAttribute("data-pe-theme", getSavedTheme());
    overlay.innerHTML = `
        <div class="pe-header">
          <div class="pe-brand">
            <span class="pe-mark"><i class="fa-solid fa-layer-group"></i></span>
            <span class="pe-brand-txt"><b class="pe-title-main">预设编辑器</b><span class="pe-brand-en">Preset Editor</span></span>
          </div>
          <div class="pe-tabs">
            <button class="pe-tab pe-active" data-tab="editor">编辑器</button>
            <button class="pe-tab" data-tab="bench">缝合台</button>
            <button class="pe-tab" data-tab="tutorial">教程</button>
            <button class="pe-tab" data-tab="preview">思维链预览</button>
          </div>
          <div class="pe-themes">
            <span class="pe-theme-cur" id="pe-theme-cur"></span>
            <select class="pe-theme-sel" id="pe-theme-sel" title="选择主题">
              <option value="obsidian">黑曜 Obsidian</option>
              <option value="manuscript">墨卷 Manuscript</option>
              <option value="platinum">月白 Platinum</option>
              <option value="sakura">樱绯 Sakura</option>
              <option value="evergreen">深林 Evergreen</option>
              <option value="inkwash">墨山 Ink Wash</option>
              <option value="crimson">绛霞 Crimson</option>
              <option value="nebula">星纚 Nebula</option>
              <option value="daylight">皓白 Daylight</option>
            </select>
          </div>
          <button id="pe-close" title="关闭"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="pe-body">
          <div class="pe-pane" data-pane="editor"></div>
          <div class="pe-pane pe-hidden" data-pane="bench"></div>
          <div class="pe-pane pe-hidden" data-pane="tutorial"></div>
          <div class="pe-pane pe-hidden" data-pane="preview"></div>
        </div>
        <div class="pe-footer">
          <div class="pe-footer-left">
            <button class="pe-btn pe-btn-icon" id="pe-export" title="导出为 JSON 备份"><i class="fa-solid fa-file-export"></i></button>
            <button class="pe-btn pe-btn-icon" id="pe-import" title="从 JSON 导入"><i class="fa-solid fa-file-import"></i></button>
            <input type="file" id="pe-import-file" accept="application/json" style="display:none">
          </div>
          <div class="pe-footer-right">
            <button class="pe-btn pe-btn-icon" id="pe-reload" title="放弃未保存的更改，重新载入"><i class="fa-solid fa-rotate-left"></i></button>
            <button class="pe-btn" id="pe-apply" title="仅在当前会话临时生效，不写入预设文件（用于试效果）"><i class="fa-solid fa-bolt"></i> 应用</button>
            <button class="pe-btn pe-btn-primary" id="pe-save" title="写入当前预设文件并立即生效"><i class="fa-solid fa-floppy-disk"></i> 保存</button>
          </div>
        </div>`;

    // 打开原生弹窗：DISPLAY = 仅右上角一个 ×；allowEscapeClose:false 防 Esc 误关
    _callGenericPopup(overlay, _POPUP_TYPE.DISPLAY, "", {
        wide: true,
        large: true,
        leftAlign: true,
        allowVerticalScrolling: true,
        allowEscapeClose: false,
        onOpen: (popup) => { try { popup.dlg.classList.add("pe-host"); } catch { /* ignore */ } },
    });

    // tab 切换
    overlay.querySelectorAll(".pe-tab").forEach(btn => {
        btn.addEventListener("click", () => {
            overlay.querySelectorAll(".pe-tab").forEach(b => b.classList.remove("pe-active"));
            btn.classList.add("pe-active");
            const tab = btn.dataset.tab;
            overlay.querySelectorAll(".pe-pane").forEach(p => p.classList.toggle("pe-hidden", p.dataset.pane !== tab));
            if (tab === "preview") renderPreview();
            if (tab === "bench") renderBench();
            if (tab === "tutorial") renderTutorial();
        });
    });

    overlay.querySelector("#pe-close").addEventListener("click", closeEditor);

    overlay.querySelector("#pe-apply").addEventListener("click", () => { if (applyToLive()) toast("success", "已在当前会话生效（未写入预设文件）。"); });
    overlay.querySelector("#pe-save").addEventListener("click", saveToPreset);
    overlay.querySelector("#pe-reload").addEventListener("click", () => { if (loadStateFromLive()) { renderEditor(); toast("info", "已重新载入，未保存的更改被放弃。"); } });
    overlay.querySelector("#pe-export").addEventListener("click", exportJson);
    overlay.querySelector("#pe-import").addEventListener("click", () => overlay.querySelector("#pe-import-file").click());
    overlay.querySelector("#pe-import-file").addEventListener("change", importJson);

    // 主题切换
    overlay.querySelector("#pe-theme-sel")?.addEventListener("change", e => applyTheme(e.target.value));
    applyTheme(getSavedTheme());

    renderEditor();
    renderTutorial();
}

function closeEditor() {
    const modal = document.getElementById("pe-modal");
    const host = modal?.closest(".popup") || document.querySelector(".pe-host");
    if (!host) return;
    const btn = host.querySelector(".popup-button-close")
        || host.querySelector(".popup-button-ok")
        || host.querySelector(".popup-button-cancel");
    if (btn) btn.click();                       // 走酒馆原生关闭（含清理）
    // 兜底：若原生关闭未生效，强制移除，保证一定能关
    setTimeout(() => {
        const stillHost = document.getElementById("pe-modal")?.closest(".popup");
        if (stillHost) { try { stillHost.close?.(); } catch { /* ignore */ } stillHost.remove(); }
    }, 80);
}

// =====================================================================
// 编辑器面板
// =====================================================================
function renderEditor() {
    const pane = document.querySelector('.pe-pane[data-pane="editor"]');
    if (!pane) return;

    pane.innerHTML = `
      <div class="pe-eyebrow">Token Budget · 上下文预算</div>
      <div class="pe-stats" id="pe-stats">
        <div class="pe-stat"><div class="pe-stat-num" id="pe-st-count">–</div><div class="pe-stat-lbl">启用条目</div></div>
        <div class="pe-stat"><div class="pe-stat-num" id="pe-st-chars">–</div><div class="pe-stat-lbl">字符</div></div>
        <div class="pe-stat"><div class="pe-stat-num" id="pe-st-tokens">…</div><div class="pe-stat-lbl">token<span class="pe-tok-mode" id="pe-st-mode">${_tokModeReal ? "实时分词" : "估算"}</span></div></div>
        <div class="pe-meter-wrap">
          <div class="pe-meter" id="pe-meter"></div>
          <div class="pe-legend" id="pe-legend"></div>
        </div>
        <button class="pe-bd-toggle" id="pe-bd-toggle" title="按条目查看 token 占用">
          <i class="fa-solid fa-chart-simple"></i> 明细 <i class="fa-solid fa-chevron-down" id="pe-bd-chev"></i>
        </button>
      </div>
      <div class="pe-breakdown ${_breakdownOpen ? "" : "pe-hidden"}" id="pe-breakdown"></div>
      <div class="pe-toolbar">
        <div class="pe-search">
          <i class="fa-solid fa-magnifying-glass"></i>
          <input type="text" id="pe-search-input" placeholder="搜索条目名称 / 内容…" value="${esc(state.search)}">
        </div>
        <div class="pe-toolbar-actions">
          <button class="pe-btn" id="pe-add-existing" title="把已存在、但不在排序中的条目重新加入"><i class="fa-solid fa-plus-minus"></i> 添加</button>
          <button class="pe-btn pe-btn-primary" id="pe-add-new"><i class="fa-solid fa-plus"></i> 新建</button>
        </div>
      </div>
      <div class="pe-eyebrow">Prompt Chain · AI 读取顺序</div>
      <div class="pe-hint"><i class="fa-solid fa-arrows-up-down"></i> 拖动左侧编号节点可排序;顺序自上而下 = AI 读取顺序(切到「思维链预览」可查看最终效果)</div>
      <div class="pe-list" id="pe-list"></div>`;

    pane.querySelector("#pe-search-input").addEventListener("input", e => {
        state.search = e.target.value;
        renderList();
    });
    pane.querySelector("#pe-add-new").addEventListener("click", addNewEntry);
    pane.querySelector("#pe-add-existing").addEventListener("click", showAddExisting);

    const bdToggle = pane.querySelector("#pe-bd-toggle");
    bdToggle && bdToggle.addEventListener("click", () => {
        _breakdownOpen = !_breakdownOpen;
        const panel = document.getElementById("pe-breakdown");
        panel?.classList.toggle("pe-hidden", !_breakdownOpen);
        const chev = document.getElementById("pe-bd-chev");
        chev?.classList.toggle("fa-chevron-up", _breakdownOpen);
        chev?.classList.toggle("fa-chevron-down", !_breakdownOpen);
        if (_breakdownOpen) { renderBreakdown(); refreshStats(); }
    });

    refreshStats();

    renderList();
}

function renderList() {
    const list = document.getElementById("pe-list");
    if (!list) return;
    const q = state.search.trim().toLowerCase();

    list.innerHTML = "";
    state.order.forEach((ord, idx) => {
        const p = findPrompt(ord.identifier);
        if (!p) return;
        if (q) {
            const hay = (displayName(p) + " " + (p.content || "")).toLowerCase();
            if (!hay.includes(q)) return;
        }
        list.appendChild(buildRow(p, ord, idx));
    });

    if (!list.children.length) {
        list.innerHTML = `<div class="pe-empty">没有匹配的条目。</div>`;
    }
}

function buildRow(p, ord, idx) {
    const row = document.createElement("div");
    row.className = "pe-row" + (ord.enabled ? "" : " pe-disabled");
    row.dataset.idx = idx;
    row.dataset.id = p.identifier;
    row.draggable = false;

    const marker = isMarker(p);
    const roleKey_ = p.role || "system";
    const rcls = "pe-bg-" + roleKey(roleKey_);
    const expanded = state.expanded.has(p.identifier);
    const absolute = isAbsolute(p);
    const posLabel = absolute ? `绝对@深度${p.injection_depth ?? 0}` : "相对";
    const meta = marker ? "" : `${fmtNum((p.content || "").length)} 字 · ≈${fmtNum(roughTokens(p.content))} t`;

    row.innerHTML = `
      <div class="pe-rail">
        <span class="pe-node" title="拖动排序">${idx + 1}</span>
      </div>
      <div class="pe-content-col">
        <div class="pe-row-head">
          <label class="pe-toggle" title="启用/禁用">
            <input type="checkbox" class="pe-en" ${ord.enabled ? "checked" : ""}>
            <span class="pe-slider"></span>
          </label>
          <span class="pe-role ${rcls}">${ROLE_LABEL[roleKey_] || roleKey_}</span>
          <span class="pe-name">${esc(displayName(p))}</span>
          ${marker ? `<span class="pe-tag pe-tag-marker" title="系统占位符，内容由 SillyTavern 自动填充">占位符</span>` : ""}
          <span class="pe-tag pe-tag-pos ${absolute ? "pe-abs" : ""}">${posLabel}</span>
          ${meta ? `<span class="pe-tag pe-tag-meta">${meta}</span>` : ""}
          <span class="pe-row-spacer"></span>
          <button class="pe-icon pe-dup" title="复制条目"><i class="fa-solid fa-clone"></i></button>
          <button class="pe-icon pe-del" title="${marker || p.system_prompt ? "从排序中移除" : "删除条目"}"><i class="fa-solid fa-trash"></i></button>
          <button class="pe-icon pe-exp" title="展开/折叠">
            <i class="fa-solid ${expanded ? "fa-chevron-up" : "fa-chevron-down"}"></i>
          </button>
        </div>
        <div class="pe-row-body ${expanded ? "" : "pe-hidden"}"></div>
      </div>`;

    // 展开内容
    if (expanded) row.querySelector(".pe-row-body").appendChild(buildEditFields(p, marker));

    // 事件
    const toggleExpand = () => {
        if (state.expanded.has(p.identifier)) state.expanded.delete(p.identifier);
        else state.expanded.add(p.identifier);
        renderList();
    };
    // 点击整条（行头空白区）即可展开/折叠；点开关、按钮、节点等控件时不触发
    row.querySelector(".pe-row-head").addEventListener("click", e => {
        if (e.target.closest(".pe-toggle, button, .pe-node, input, label, select, textarea, a")) return;
        toggleExpand();
    });
    row.querySelector(".pe-en").addEventListener("change", e => {
        state.order[idx].enabled = e.target.checked;
        row.classList.toggle("pe-disabled", !e.target.checked);
        refreshStats();
    });
    row.querySelector(".pe-exp").addEventListener("click", toggleExpand);
    row.querySelector(".pe-dup").addEventListener("click", () => duplicateEntry(p, idx));
    row.querySelector(".pe-del").addEventListener("click", () => deleteEntry(p, idx));

    // 拖拽排序(编号节点即手柄)
    const handle = row.querySelector(".pe-node");
    handle.addEventListener("mousedown", () => { row.draggable = true; });
    row.addEventListener("dragstart", e => {
        e.dataTransfer.setData("text/plain", String(idx));
        e.dataTransfer.effectAllowed = "move";
        row.classList.add("pe-dragging");
    });
    row.addEventListener("dragend", () => { row.draggable = false; row.classList.remove("pe-dragging"); });
    row.addEventListener("dragover", e => { e.preventDefault(); row.classList.add("pe-dragover"); });
    row.addEventListener("dragleave", () => row.classList.remove("pe-dragover"));
    row.addEventListener("drop", e => {
        e.preventDefault();
        row.classList.remove("pe-dragover");
        const from = parseInt(e.dataTransfer.getData("text/plain"), 10);
        const to = idx;
        if (Number.isNaN(from) || from === to) return;
        const moved = state.order.splice(from, 1)[0];
        state.order.splice(to, 0, moved);
        renderList();
    });

    return row;
}

function buildEditFields(p, marker) {
    const wrap = document.createElement("div");
    wrap.className = "pe-fields";
    const absolute = isAbsolute(p);

    wrap.innerHTML = `
      <div class="pe-field">
        <label>名称 <span class="pe-q" data-help="name">?</span></label>
        <input type="text" class="pe-f-name" value="${esc(p.name || "")}" ${marker ? "disabled" : ""}
               placeholder="${marker ? "占位符名称由系统决定" : "便于你识别，不影响 AI"}">
      </div>
      <div class="pe-field-grid">
        <div class="pe-field">
          <label>角色 <span class="pe-q" data-help="role">?</span></label>
          <select class="pe-f-role" ${marker ? "disabled" : ""}>
            <option value="system" ${p.role === "system" || !p.role ? "selected" : ""}>系统 (system)</option>
            <option value="user" ${p.role === "user" ? "selected" : ""}>用户 (user)</option>
            <option value="assistant" ${p.role === "assistant" ? "selected" : ""}>AI (assistant)</option>
          </select>
        </div>
        <div class="pe-field">
          <label>注入位置 <span class="pe-q" data-help="position">?</span></label>
          <select class="pe-f-pos">
            <option value="0" ${!absolute ? "selected" : ""}>相对(按排序)</option>
            <option value="1" ${absolute ? "selected" : ""}>绝对(聊天内@深度)</option>
          </select>
        </div>
        <div class="pe-field pe-f-depth-wrap ${absolute ? "" : "pe-hidden"}">
          <label>深度 <span class="pe-q" data-help="depth">?</span></label>
          <input type="number" class="pe-f-depth" min="0" value="${Number(p.injection_depth ?? 4)}">
        </div>
        <div class="pe-field pe-f-order-wrap ${absolute ? "" : "pe-hidden"}">
          <label>顺序 <span class="pe-q" data-help="order">?</span></label>
          <input type="number" class="pe-f-order" value="${Number(p.injection_order ?? 100)}">
        </div>
      </div>
      ${marker ? `
        <div class="pe-marker-note"><i class="fa-solid fa-circle-info"></i>
          这是<b>占位符</b>:内容由 SillyTavern 在生成时自动填充(${esc(MARKER_NAMES[p.identifier] || p.identifier)})。
          你只能调整它在序列中的<b>位置</b>与<b>启用状态</b>。</div>
      ` : `
        <div class="pe-field">
          <label>内容 <span class="pe-q" data-help="content">?</span> <button type="button" class="pe-maxi-btn pe-f-maxi">⛶ 放大</button></label>
          <textarea class="pe-f-content" rows="6" placeholder="提示词正文…">${esc(p.content || "")}</textarea>
          <div class="pe-field-foot"><span class="pe-f-count">${fmtNum((p.content || "").length)} 字 · ≈${fmtNum(roughTokens(p.content))} token</span></div>
        </div>
        <div class="pe-field pe-checkbox">
          <label><input type="checkbox" class="pe-f-forbid" ${p.forbid_overrides ? "checked" : ""}>
            禁止被角色卡覆盖 <span class="pe-q" data-help="forbid">?</span></label>
        </div>
      `}
    `;

    // 字段事件 -> 写入 state.prompts
    const tgt = findPrompt(p.identifier);
    const q = sel => wrap.querySelector(sel);
    q(".pe-f-name") && q(".pe-f-name").addEventListener("input", e => { tgt.name = e.target.value; });
    q(".pe-f-role") && q(".pe-f-role").addEventListener("change", e => { tgt.role = e.target.value; renderList?.(); });
    const footEl = wrap.querySelector(".pe-f-count");
    let footTimer = null;
    function setFootReal(val) {
        clearTimeout(footTimer);
        footTimer = setTimeout(async () => {
            const real = await countTokensCached(val);
            if (footEl) footEl.textContent = `${fmtNum(val.length)} 字 · ${fmtNum(real)} token${_tokModeReal ? "" : " (估算)"}`;
        }, 300);
    }
    if (!marker && footEl) setFootReal(p.content || ""); // 展开时算一次真实值

    q(".pe-f-content") && q(".pe-f-content").addEventListener("input", e => {
        const val = e.target.value;
        tgt.content = val;
        const len = val.length;
        // 即时显示估算，稳定后替换为真实分词
        if (footEl) footEl.textContent = `${fmtNum(len)} 字 · ≈${fmtNum(roughTokens(val))} token`;
        setFootReal(val);
        // 行头标签即时估算（真实值会在统计刷新后回填）
        const rowEl = wrap.closest(".pe-row");
        const metaTag = rowEl?.querySelector(".pe-tag-meta");
        if (metaTag) metaTag.textContent = `${fmtNum(len)} 字 · ≈${fmtNum(roughTokens(val))} t`;
        refreshStats();
    });
    q(".pe-f-forbid") && q(".pe-f-forbid").addEventListener("change", e => { tgt.forbid_overrides = e.target.checked; });
    q(".pe-f-maxi") && q(".pe-f-maxi").addEventListener("click", () => openMaxi(tgt, q(".pe-f-content"), false));
    const posSel = q(".pe-f-pos");
    posSel.addEventListener("change", e => {
        tgt.injection_position = Number(e.target.value);
        if (tgt.injection_position === 1) {
            if (tgt.injection_depth === undefined) tgt.injection_depth = 4;
            if (tgt.injection_order === undefined) tgt.injection_order = 100;
        }
        wrap.querySelector(".pe-f-depth-wrap").classList.toggle("pe-hidden", tgt.injection_position !== 1);
        wrap.querySelector(".pe-f-order-wrap").classList.toggle("pe-hidden", tgt.injection_position !== 1);
        renderList();
    });
    q(".pe-f-depth") && q(".pe-f-depth").addEventListener("input", e => { tgt.injection_depth = Number(e.target.value); });
    q(".pe-f-order") && q(".pe-f-order").addEventListener("input", e => { tgt.injection_order = Number(e.target.value); });

    // 小问号 -> 跳到教程
    wrap.querySelectorAll(".pe-q").forEach(el => {
        el.addEventListener("click", () => gotoTutorial(el.dataset.help));
    });

    return wrap;
}

// ----- 统计：字符 / token / 角色分布 / 按条目明细 -----
let _statsTimer = null;
let _statsRun = 0;
let _entryStats = [];        // [{identifier,name,role,chars,t}] 按 token 降序
let _breakdownOpen = false;
function refreshStats() {
    clearTimeout(_statsTimer);
    _statsTimer = setTimeout(computeAndRenderStats, 250);
}

async function computeAndRenderStats() {
    const run = ++_statsRun; // 防止并发竞态
    const enabled = state.order.filter(o => o.enabled).map(o => findPrompt(o.identifier)).filter(Boolean);
    const authored = enabled.filter(p => !isMarker(p));

    // 字符数与条目数可即时显示
    let chars = 0;
    authored.forEach(p => { chars += (p.content || "").length; });
    setText("pe-st-count", fmtNum(enabled.length));
    setText("pe-st-chars", fmtNum(chars));

    // 真实 token（异步）
    const results = await Promise.all(authored.map(async p => {
        const content = p.content || "";
        const t = await countTokensCached(content);
        return { identifier: p.identifier, name: displayName(p), role: p.role || "system", chars: content.length, t };
    }));
    if (run !== _statsRun) return; // 已有更新的一次在跑，丢弃本次

    const byRole = { system: 0, user: 0, assistant: 0 };
    let total = 0;
    results.forEach(r => { byRole[r.role] = (byRole[r.role] || 0) + r.t; total += r.t; });
    _entryStats = results.slice().sort((a, b) => b.t - a.t);

    setText("pe-st-tokens", fmtNum(total));
    setText("pe-st-mode", _tokModeReal ? "实时分词" : "估算");

    // 角色分布条
    const order = ["system", "user", "assistant"];
    const meter = document.getElementById("pe-meter");
    if (meter) meter.innerHTML = order.map(r => {
        const w = total ? (byRole[r] / total * 100) : 0;
        return `<span class="pe-meter-seg pe-bg-${roleKey(r)}" style="width:${w}%"></span>`;
    }).join("");
    const legend = document.getElementById("pe-legend");
    if (legend) legend.innerHTML = order.map(r =>
        `<span><i class="pe-bg-${roleKey(r)}"></i>${ROLE_LABEL[r]} <b>${fmtNum(byRole[r])}</b></span>`
    ).join("");

    // 用真实 token 刷新各行尾部标签
    results.forEach(r => {
        const tag = document.querySelector(`#pe-list .pe-row[data-id="${cssAttr(r.identifier)}"] .pe-tag-meta`);
        if (tag) tag.textContent = `${fmtNum(r.chars)} 字 · ${fmtNum(r.t)} t`;
    });

    if (_breakdownOpen) renderBreakdown(total);
}

function renderBreakdown(total) {
    const panel = document.getElementById("pe-breakdown");
    if (!panel) return;
    if (!_entryStats.length) {
        panel.innerHTML = `<div class="pe-bd-empty">暂无可统计的文本条目（占位符的运行时内容不计入）。</div>`;
        return;
    }
    total = (total ?? _entryStats.reduce((a, b) => a + b.t, 0)) || 1;
    const max = Math.max(...(_entryStats.map(s => s.t)), 1);
    panel.innerHTML = `
      <div class="pe-bd-head">
        <span>按条目 token 占用 · 从高到低（占位符运行时内容不计）</span>
        <span class="pe-bd-total">合计 <b>${fmtNum(total)}</b></span>
      </div>
      <div class="pe-bd-list">
        ${_entryStats.map((s, i) => {
            const pct = (s.t / total * 100);
            const w = (s.t / max * 100);
            const rc = roleKey(s.role);
            return `<div class="pe-bd-item">
              <span class="pe-bd-rank">${i + 1}</span>
              <span class="pe-role pe-role-sm pe-bg-${rc}">${ROLE_LABEL[s.role]}</span>
              <span class="pe-bd-name" title="${esc(s.name)}">${esc(s.name)}</span>
              <span class="pe-bd-bar"><span class="pe-bg-${rc}" style="width:${w}%"></span></span>
              <span class="pe-bd-tok">${fmtNum(s.t)}</span>
              <span class="pe-bd-pct">${pct.toFixed(1)}%</span>
            </div>`;
        }).join("")}
      </div>`;
}

function setText(id, txt) { const el = document.getElementById(id); if (el) el.textContent = txt; }
function cssAttr(s) { return String(s).replace(/["\\]/g, "\\$&"); }

// ----- 条目增删改 -----
function addNewEntry() {
    const id = uuid();
    const p = {
        identifier: id,
        name: "新条目",
        role: "system",
        content: "",
        system_prompt: false,
        marker: false,
        injection_position: 0,
        injection_depth: 4,
        injection_order: 100,
        forbid_overrides: false,
    };
    state.prompts.push(p);
    state.order.push({ identifier: id, enabled: true });
    state.expanded.add(id);
    renderEditor();
    // 滚动到底部
    const list = document.getElementById("pe-list");
    list && (list.scrollTop = list.scrollHeight);
}

function duplicateEntry(p, idx) {
    const id = uuid();
    const copy = deepClone(p);
    copy.identifier = id;
    copy.name = (displayName(p)) + " 副本";
    copy.marker = false;          // 副本不再是占位符
    copy.system_prompt = false;
    state.prompts.push(copy);
    state.order.splice(idx + 1, 0, { identifier: id, enabled: state.order[idx].enabled });
    state.expanded.add(id);
    renderList();
}

function deleteEntry(p, idx) {
    const protectedEntry = isMarker(p) || p.system_prompt;
    state.order.splice(idx, 1);
    if (!protectedEntry) {
        const pi = state.prompts.findIndex(x => x.identifier === p.identifier);
        if (pi >= 0) state.prompts.splice(pi, 1);
    }
    state.expanded.delete(p.identifier);
    renderList();
    refreshStats();
}

function showAddExisting() {
    const inOrder = new Set(state.order.map(o => o.identifier));
    const available = state.prompts.filter(p => !inOrder.has(p.identifier));
    if (!available.length) { toast("info", "没有可重新添加的条目(所有条目都已在排序里)。"); return; }

    const box = document.createElement("div");
    box.className = "pe-popover";
    box.innerHTML = `<div class="pe-popover-title">添加已有条目</div>` +
        available.map(p => `
          <div class="pe-popover-item" data-id="${esc(p.identifier)}">
            <span class="pe-role pe-bg-${roleKey(p.role)}">${ROLE_LABEL[p.role] || p.role || "系统"}</span>
            ${esc(displayName(p))}
          </div>`).join("");
    document.getElementById("pe-modal").appendChild(box);

    box.querySelectorAll(".pe-popover-item").forEach(it => {
        it.addEventListener("click", () => {
            state.order.push({ identifier: it.dataset.id, enabled: true });
            box.remove();
            renderList();
            refreshStats();
        });
    });
    const off = e => { if (!box.contains(e.target)) { box.remove(); document.removeEventListener("mousedown", off); } };
    setTimeout(() => document.addEventListener("mousedown", off), 0);
}

// ----- 导入 / 导出 -----
function exportJson() {
    const data = { prompts: state.prompts, order: state.order, _note: "由 预设编辑器 导出，仅含提示词与排序" };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `preset-prompts-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
}

function importJson(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
        try {
            const data = JSON.parse(reader.result);
            // 支持两种格式:本扩展导出的 {prompts,order}，或完整 ST 预设 {prompts, prompt_order}
            if (Array.isArray(data.prompts)) state.prompts = deepClone(data.prompts);
            if (Array.isArray(data.order)) {
                state.order = deepClone(data.order);
            } else if (Array.isArray(data.prompt_order)) {
                const ref = data.prompt_order.find(x => Array.isArray(x.order)) || data.prompt_order[0];
                state.order = ref ? deepClone(ref.order) : [];
            }
            state.expanded = new Set();
            renderEditor();
            toast("success", "已导入。记得点「应用」或「保存」生效。");
        } catch (err) {
            console.error(err);
            toast("error", "导入失败：不是有效的 JSON。");
        }
    };
    reader.readAsText(file);
    e.target.value = "";
}

// =====================================================================
// 思维链预览
// =====================================================================
function renderPreview() {
    const pane = document.querySelector('.pe-pane[data-pane="preview"]');
    if (!pane) return;

    // 启用的条目，按当前排序
    const enabled = state.order.filter(o => o.enabled)
        .map(o => findPrompt(o.identifier)).filter(Boolean);

    const relative = enabled.filter(p => !isAbsolute(p));
    const absolute = enabled.filter(p => isAbsolute(p))
        .sort((a, b) => (Number(b.injection_depth ?? 0) - Number(a.injection_depth ?? 0))
            || (Number(a.injection_order ?? 100) - Number(b.injection_order ?? 100)));

    let html = `
      <div class="pe-preview-intro">
        <i class="fa-solid fa-circle-info"></i>
        下面按 AI <b>实际读取顺序</b>(自上而下)展示。<b>相对</b>条目按排序排列;
        <b>绝对(@深度)</b>条目会被插入「聊天记录」内部 —— 深度越大越靠上，深度 0 紧贴最新消息。
      </div>
      <div class="pe-flow">`;

    relative.forEach((p, i) => {
        const isChat = p.identifier === "chatHistory";
        html += flowCard(p, i + 1, isChat ? absolute : null);
    });

    html += `</div>`;

    if (!relative.length) html = `<div class="pe-empty">没有启用的条目。</div>`;

    // 旁注:绝对条目没有 chatHistory 时
    if (absolute.length && !relative.some(p => p.identifier === "chatHistory")) {
        html += `<div class="pe-preview-warn"><i class="fa-solid fa-triangle-exclamation"></i>
          有 ${absolute.length} 个绝对(@深度)条目，但当前排序里没有启用「聊天记录」占位符，它们将注入到(空的)聊天历史位置。</div>`;
    }

    pane.innerHTML = html;
}

function flowCard(p, n, absoluteList) {
    const rk = p.role || "system";
    const rc = roleKey(rk);
    const marker = isMarker(p);
    const preview = marker
        ? `<span class="pe-flow-marker">由系统填充：${esc(MARKER_NAMES[p.identifier] || p.identifier)}</span>`
        : esc((p.content || "").slice(0, 160)) + ((p.content || "").length > 160 ? "…" : "");

    let inner = `
      <div class="pe-flow-card pe-bl-${rc}">
        <div class="pe-flow-top">
          <span class="pe-flow-n">${n}</span>
          <span class="pe-role pe-bg-${rc}">${ROLE_LABEL[rk] || rk}</span>
          <span class="pe-flow-name">${esc(displayName(p))}</span>
          ${marker ? `<span class="pe-tag pe-tag-marker">占位符</span>` : ""}
        </div>
        <div class="pe-flow-content ${marker ? "pe-flow-content-marker" : ""}">${preview || "<i>(空)</i>"}</div>`;

    // 聊天记录内部的绝对注入
    if (p.identifier === "chatHistory" && absoluteList && absoluteList.length) {
        inner += `<div class="pe-chat-block"><div class="pe-chat-label">聊天记录内部 · 深度注入</div>`;
        absoluteList.forEach(a => {
            const arc = roleKey(a.role || "system");
            inner += `<div class="pe-inject pe-bl-${arc}">
                <span class="pe-inject-depth">@深度 ${a.injection_depth ?? 0}</span>
                <span class="pe-role pe-role-sm pe-bg-${arc}">${ROLE_LABEL[a.role || "system"]}</span>
                <span>${esc(displayName(a))}</span>
                <span class="pe-inject-prev">${esc((a.content || "").slice(0, 60))}${(a.content || "").length > 60 ? "…" : ""}</span>
              </div>`;
        });
        inner += `</div>`;
    }
    inner += `</div>`;
    return inner;
}

// =====================================================================
// 教程
// =====================================================================
function gotoTutorial(anchor) {
    const tabBtn = document.querySelector('.pe-tab[data-tab="tutorial"]');
    tabBtn?.click();
    setTimeout(() => {
        const el = document.getElementById("pe-help-" + anchor);
        el?.scrollIntoView({ behavior: "smooth", block: "start" });
        el?.classList.add("pe-flash");
        setTimeout(() => el?.classList.remove("pe-flash"), 1500);
    }, 60);
}

function renderTutorial() {
    const pane = document.querySelector('.pe-pane[data-pane="tutorial"]');
    if (!pane || pane.dataset.built === "1") return;
    pane.dataset.built = "1";

    pane.innerHTML = `
    <div class="pe-tut">
      <div class="pe-tut-lead">
        「聊天补全预设」本质上是一份<b>给 AI 的说明书清单</b>。每一条目就是一段会被发给模型的文字(或一个占位符)。
        清单的<b>顺序</b>决定 AI 先读到什么、后读到什么 —— 这往往比内容本身更影响表现。
      </div>

      <div class="pe-tut-card" id="pe-help-name">
        <h3><i class="fa-solid fa-tag"></i> 名称 (Name)</h3>
        <p>条目在列表里的显示名,<b>只给你自己看</b>,不会发送给 AI,也不影响输出。随便起个好辨认的名字即可,比如「主提示词」「越狱」「输出格式要求」。</p>
      </div>

      <div class="pe-tut-card" id="pe-help-role">
        <h3><i class="fa-solid fa-user-tag"></i> 角色 (Role)</h3>
        <p>这条文字以<b>谁的身份</b>发给模型。聊天补全 API 把每条消息标记为三种身份之一:</p>
        <ul>
          <li><b>系统 (system)</b>:设定 / 规则 / 背景。模型把它当作「权威设定」,而不是对话内容。绝大多数提示词(人设、规则、格式要求)都用系统。</li>
          <li><b>用户 (user)</b>:当作「用户说的话」。常用于举例(few-shot)里用户的发言。</li>
          <li><b>AI (assistant)</b>:当作「AI 之前说过的话」。常用于:① 举例里 AI 的示范回答;② 在最末尾放一句来<b>引导/预填</b> AI 接下来的语气或开头(类似 prefill)。</li>
        </ul>
        <p class="pe-tut-tip">所谓「角色归于系统」,就是把这条设成 <b>system</b>:模型会把它理解成设定而非聊天。部分模型对 system 的遵从度更高,所以核心规则一般放 system。</p>
      </div>

      <div class="pe-tut-card" id="pe-help-position">
        <h3><i class="fa-solid fa-location-dot"></i> 注入位置 (Position)</h3>
        <p>决定这条文字被放到「最终提示」的<b>哪里</b>,有两种模式:</p>
        <ul>
          <li><b>相对 (按排序)</b> ——默认。它的位置就是<b>它在本列表中的位置</b>。它在「聊天记录」占位符<u>之前</u>就排在对话前面,在<u>之后</u>就排在对话后面。大多数条目用这个。</li>
          <li><b>绝对 (聊天内 @ 深度)</b> ——无视列表位置,直接<b>插进聊天记录内部</b>的某个深度(见下)。效果类似世界书里「按深度注入」的条目。适合需要紧贴最新对话、反复提醒模型的指令。</li>
        </ul>
      </div>

      <div class="pe-tut-card" id="pe-help-depth">
        <h3><i class="fa-solid fa-layer-group"></i> 深度 (Depth) <span class="pe-only">仅「绝对」位置</span></h3>
        <p>从聊天记录<b>末尾往回数</b>第几条消息<b>之前</b>插入。</p>
        <ul>
          <li><b>深度 0</b>:插在最末尾 —— 紧贴 AI 即将生成的回复,影响力最强(常用于强力指令、输出格式)。</li>
          <li><b>深度 1</b>:插在「最后一条消息」之前;数字越大,插得越靠上(越早)。</li>
        </ul>
        <p class="pe-tut-tip">想让某条规则「时刻在 AI 眼前」,放浅深度(0~4);想当背景铺垫,放深一点。</p>
      </div>

      <div class="pe-tut-card" id="pe-help-order">
        <h3><i class="fa-solid fa-arrow-down-1-9"></i> 顺序 (Order) <span class="pe-only">仅「绝对」位置</span></h3>
        <p>当<b>多个绝对条目处在同一深度</b>时,用这个数字决定它们之间谁先谁后(<b>数字小的在前</b>)。只有同深度撞车时才需要在意它,默认 100 通常不用改。</p>
      </div>

      <div class="pe-tut-card" id="pe-help-content">
        <h3><i class="fa-solid fa-pen"></i> 内容 (Content)</h3>
        <p>真正发给 AI 的正文。这里支持 ST 的<b>宏(macro)</b>,例如 <code>{{char}}</code>(角色名)、<code>{{user}}</code>(你的名字)、<code>{{persona}}</code> 等,生成时会被替换成实际值。占位符条目没有这个框 —— 它们的内容由系统自动填。</p>
      </div>

      <div class="pe-tut-card" id="pe-help-forbid">
        <h3><i class="fa-solid fa-lock"></i> 禁止被角色卡覆盖 (Forbid Overrides)</h3>
        <p>有些角色卡会自带「主提示词覆盖」或「历史后指令覆盖」。勾上后,本条目<b>锁定你预设里的写法</b>,不会被角色卡顶替。想让预设规则永远生效时勾上;想让角色卡能自定义时留空。</p>
      </div>

      <div class="pe-tut-card pe-tut-markers">
        <h3><i class="fa-solid fa-puzzle-piece"></i> 占位符 (Markers) —— 内容由系统自动填</h3>
        <p>带「占位符」标签的条目<b>没有可编辑内容</b>,它们只是「在这里插入某类内容」的<b>位置标记</b>。你能做的是<b>调整它们的前后顺序和启用</b>。常见占位符:</p>
        <ul>
          <li><b>角色描述 / 角色性格 / 场景</b>:来自角色卡对应字段。</li>
          <li><b>用户角色 (persona) 描述</b>:你的人物设定。</li>
          <li><b>对话示例</b>:角色卡里的示例对话。</li>
          <li><b>聊天记录</b>:真正的对话消息流。<u>它的位置极其关键</u> —— 它把整个清单分成「对话前(设定区)」和「对话后(收尾指令区)」两半。</li>
          <li><b>世界书(前置/后置)</b>:被触发的世界书条目,分别插在对话前/后。</li>
          <li><b>主提示词 / 辅助提示词 / 历史后指令</b>:这几个虽然常带内容,但也作为标准锚点存在。<b>历史后指令</b>排在「聊天记录」之后,是 AI 回复前看到的<b>最后一段指令</b>,影响力很强,常被当作「越狱/强约束」位。</li>
        </ul>
      </div>

      <div class="pe-tut-card pe-tut-flow">
        <h3><i class="fa-solid fa-diagram-project"></i> 一图理解读取顺序</h3>
        <p>AI 大致按这个顺序「读」你的预设(具体取决于你的排序):</p>
        <div class="pe-tut-pipeline">
          <span>主提示词/规则</span><i class="fa-solid fa-arrow-right"></i>
          <span>角色/人设/世界书(前)</span><i class="fa-solid fa-arrow-right"></i>
          <span>对话示例</span><i class="fa-solid fa-arrow-right"></i>
          <span class="pe-pipe-chat">聊天记录<small>(绝对@深度条目插这里)</small></span><i class="fa-solid fa-arrow-right"></i>
          <span>世界书(后)</span><i class="fa-solid fa-arrow-right"></i>
          <span class="pe-pipe-last">历史后指令(最后看到)</span>
        </div>
        <p class="pe-tut-tip">想看你<b>当前这份预设</b>的真实顺序,切到「思维链预览」标签页。</p>
      </div>

      <div class="pe-tut-card pe-tut-save">
        <h3><i class="fa-solid fa-floppy-disk"></i> 保存说明</h3>
        <ul>
          <li><b>保存</b>（金色按钮）：把你的改动写入<b>当前选中的预设文件</b>并立即生效。这是最常用的一键保存,点它就行。</li>
          <li><b>应用</b>：只让改动在<b>当前会话临时生效</b>、方便你先试效果,<u>不</u>写入文件。想保留就再点「保存」。</li>
          <li><b>放弃</b>（↺ 图标）：丢弃所有未保存的改动,重新载入当前预设。</li>
          <li><b>导出 / 导入 JSON</b>（左下角图标）：把提示词与排序导出成文件备份;导入支持本扩展格式或完整 ST 预设文件。</li>
        </ul>
        <p class="pe-tut-tip">小提示:点「保存」后若个别 ST 版本未能直接写文件,扩展会自动去点 SillyTavern 预设栏的原生保存按钮兜底,正常情况下你无需手动操作。</p>
      </div>
    </div>`;
}

// =====================================================================
// 初始化:注入入口按钮
// =====================================================================
function injectLaunchButton() {
    if (document.getElementById("pe-menu-item")) return;

    const menu = document.getElementById("extensionsMenu");
    if (menu) {
        const item = document.createElement("div");
        item.id = "pe-menu-item";
        item.className = "list-group-item flex-container flexGap5 interactable";
        item.tabIndex = 0;
        item.innerHTML = `<div class="fa-solid fa-sliders extensionsMenuExtensionButton"></div><span>${LABEL}</span>`;
        item.addEventListener("click", () => { document.getElementById("extensionsMenu")?.classList.remove("show"); openEditor(); });
        menu.appendChild(item);
    } else {
        // 回退:右下角浮动按钮
        if (document.getElementById("pe-fab")) return;
        const fab = document.createElement("div");
        fab.id = "pe-fab";
        fab.title = LABEL;
        fab.innerHTML = `<i class="fa-solid fa-sliders"></i>`;
        fab.addEventListener("click", openEditor);
        document.body.appendChild(fab);
    }
}

async function init() {
    await loadDeps();
    await loadTokenizer();
    injectLaunchButton();
    // 菜单有时是延迟渲染的，补一次
    setTimeout(injectLaunchButton, 1500);
    console.log(`[${EXT_ID}] 已加载`);
}

jQuery(async () => {
    try {
        if (eventSource && event_types?.APP_READY) {
            eventSource.on(event_types.APP_READY, init);
        }
    } catch { /* ignore */ }
    // 双保险:DOM 就绪后也尝试一次
    setTimeout(init, 800);
});
