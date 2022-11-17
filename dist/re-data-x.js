(()=>{"use strict";class e{target;thisArg;args;constructor(e,t,s){this.target=e,this.thisArg=t,this.args=s}async exec(e=this.target,t=this.thisArg,s=this.args){return await Reflect.apply(e,t,s)}}class t{queue=[];enqueue(e,t=this.queue){t.push(e)}async exec(e=this.queue){for(;;){const t=e.slice();if(0===t.length)break;e.splice(0);for(const e of t)await e.exec()}}}const s=class{static getPath(e,t){let s=0;return e.replaceAll("*",(()=>t[s++]??""))}static raise(e){throw e}static isFunction=e=>{const t=Object.prototype.toString.call(e).slice(8,-1).toLowerCase();return"function"===t||"asyncfunction"===t};static isSymbol=e=>"symbol"==typeof e;static toElement=e=>e instanceof HTMLElement?e:utils.raise(`node ${e} is not HTMLElement`);static toTemplate=e=>e instanceof HTMLTemplateElement?e:utils.raise(`node ${e} is not HTMLTemplateElement`);static toInput=e=>e instanceof HTMLInputElement?e:utils.raise(`node ${e} is not HTMLInputElement`);static toKebabCase=e=>e.replaceAll(/([A-Z])/g,((e,t,s)=>(s>0?"-":"")+t.toLowerCase()))};class o{component;prop;indexes;path;key;constructor(e,t,o){const n=o??[];this.component=e,this.prop=t,this.indexes=n,this.path=s.getPath(t,n),this.indexesKey=this.indexes.join("\t"),this.key=`${this.prop}\t${this.indexesKey}`}}class n{node;props;proc;constructor(e,t,s){this.node=e,this.props=t,this.proc=s}}class i{queue=[];enqueue(e,t=this.queue){t.push(e)}static reorder(e){const t=e.slice();return t.sort(((e,t)=>e.node instanceof HTMLSelectElement&&1===e.props.length&&"value"===e.props[0]?1:-1)),t}exec(e=this.queue){for(;;){const t=e.slice();if(0===t.length)break;e.splice(0);const s=i.reorder(t);for(const e of s)e.proc()}}}class r{asyncProc=new t;notify=new class{queue=[];component;constructor(e){this.component=e}enqueue(e,t=this.queue){e.component.isInitializing||t.push(e)}updateElements(e=this.queue){for(;;){const t=e.slice();if(0===t.length)break;e.splice(0);const s=new Map;t.forEach((e=>{s.has(e.component)||s.set(e.component,[]),s.get(e.component).push(e)}));for(let[e,t]of s.entries()){const s=e?.viewModelProxy,n=t=>{const n=s?.$setOfArrayProps??new Set,i=s?.$setOfRelativePropsByProp??new Set,r=new Set;for(const e of t){if(!n.has(e.prop))continue;const s=i[e.prop]??new Set;for(const e of t)s.has(e.prop)&&r.add(e)}t=t.filter((e=>!r.has(e)));const a=[];("$onNotify"in s??1)&&a.push(...Array.from(t).flatMap((e=>s.$onNotify(e))).filter((e=>null!=e)).map((t=>new o(e,t.prop,t?.indexes))));for(const s of t){let t=new Set;if(n.has(s.prop)){const e=`${s.prop}.*.`;i.get(s.prop)?.forEach((s=>!s.startsWith(e)&&t.add(s)))}else t=i.get(s.prop)??new Set;a.push(...Array.from(t).map((t=>new o(e,t,s?.indexes))))}return a},i=[t];let r=t;for(;;){const e=n(r);if(0===e.length)break;i.push(e),r=e}const a=i.flatMap((e=>e)),c=new Map;a.reduce(((e,t)=>e.set(t.path,t)),c);const p=new Set(c.keys());s.$deleteCache(p),e.binder.update(p,new Set),("$onChange"in s??1)&&s.$asyncProc((async()=>{await s.$onChange(Array.from(c.values()))}))}}}};updateNodeScheduler=new i;constructor(){}enqueueAsyncProc(e){this.asyncProc.enqueue(e)}enqueueNotify(e){this.notify.enqueue(e)}enqueueUpdateNode(e){this.updateNodeScheduler.enqueue(e)}async exec(){for(;await this.asyncProc.exec(),this.notify.updateElements(),this.updateNodeScheduler.exec(),0!=this.asyncProc.queue.length||0!=this.notify.queue.length||0!=this.updateNodeScheduler.queue.length;);}}class a{resolve;reject;updator;component;constructor(e=null){this.component=e,this.main()}wakeup(e){this.resolve(e)}stop(){this.reject()}sleep(){return new Promise(((e,t)=>{this.resolve=e,this.reject=t}))}async main(){for(;;)try{this.updator=await this.sleep();try{console.time("update"),await this.updator.exec(),console.timeEnd("update")}finally{this.updator=null}}catch(e){if(console.error(e),!confirm("致命的エラーが発生しました。継続しますか？"))break}}asyncProc(t,s,o){const n=this.updator??new r;n.enqueueAsyncProc(new e(t,s,o)),this.updator||this.wakeup(n)}notify(e,t,s){const n=this.updator??new r;n.enqueueNotify(new o(e,t,s)),this.updator||this.wakeup(n)}updateNode(e,t,s){const o=this.updator??new r;o.enqueueUpdateNode(new n(e,t,s)),this.updator||this.wakeup(o)}static queue=[new a];static get current(){return this.queue.at(-1)}static suspend(e){this.queue.push(new a(e))}static resume(){this.queue.pop().stop()}}class c{prop;indexes;path;regexp;level;constructor(e,t,s,o=!1){this.prop=e,this.indexes=t?.slice(0)??[],this.path=s,this.isExpandable=o,this.regexp=o?new RegExp("^"+this.prop.replaceAll("*","(\\w+)").replaceAll(".","\\.")+"$"):null,this.level=this.prop.match(/\*/g)?.length??0,this.propIndexes=this.indexes.slice(-this.level)??[]}static getValue(e,t){return e.$getValue(t.prop,t.indexes,t.path)}static setValue(e,t,s){return e.$setValue(t.prop,t.indexes,t.path,s),!0}static cache=new Map;static expandableProperties=[];static create(e,t=null){const o=t?s.getPath(e,t):e,n=e===o&&e.includes("*"),i=new c(e,t,o,n);return n&&this.expandableProperties.push(i),i}}const p=class{static cache=new Map;static trim=e=>e.trim();static has=e=>e.length>0;static parseFilter=e=>{const[t,...s]=e.split(",").map(this.trim);return Object.assign(new class{name;options},{name:t,options:s})};static parseViewModelProp=e=>{const[t,...s]=e.split("|").map(this.trim);return[t,s.map((e=>this.parseFilter(e)))]};static parseBind=(e,t)=>{const[s,o]=[t].concat(...e.split(":").map(this.trim)).splice(-2),[n,i]=this.parseViewModelProp(o);return[s,n,i]};static parseBinds=(e,t)=>{const s=`${e}\t${t}`;if(this.cache.has(s))return this.cache.get(s);{const o=e.split(";").map(this.trim).filter(this.has).map((e=>this.parseBind(e,"$"))).map((([e,s,o])=>(s="@"===s?e:s,[e="$"===e?t:e,s,o])));return this.cache.set(s,o),o}}};class l{static localeString=(e,t)=>null!=e?Number(e).toLocaleString():"";static fixed=(e,t)=>e?.toFixed(t[0]??0)??"";static styleDisplay=(e,t)=>e?t[0]??"":"none";static truthy=(e,t)=>!!e;static falsey=(e,t)=>!e;static not=this.falsey;static upperCase=(e,t)=>e?.toUpperCase()??"";static lowerCase=(e,t)=>e?.toLowerCase()??"";static eq=(e,t)=>e==t[0];static ne=(e,t)=>e!=t[0];static lt=(e,t)=>Number(e)<Number(t[0]);static le=(e,t)=>Number(e)<=Number(t[0]);static gt=(e,t)=>Number(e)>Number(t[0]);static ge=(e,t)=>Number(e)>=Number(t[0]);static embed=(e,t)=>decodeURI((t[0]??"").replaceAll("%s",e));static ifText=(e,t)=>e?t[0]??"":t[1]??"";static null=(e,t)=>null==e}class d{}class h{static applyForInput=(e,t)=>t.reduceRight(((e,t)=>t.name in d?d[t.name](e,t.options):e),e);static applyForOutput=(e,t)=>t.reduce(((e,t)=>t.name in l?l[t.name](e,t.options):e),e)}class u extends FileReader{constructor(){super()}#e(e,t){return new Promise(((s,o)=>{super.addEventListener("load",(({target:e})=>s(e.result))),super.addEventListener("error",(({target:e})=>o(e.error))),super[t](e)}))}readAsArrayBuffer(e){return this.#e(e,"readAsArrayBuffer")}readAsDataURL(e){return this.#e(e,"readAsDataURL")}readAsText(e){return this.#e(e,"readAsText")}}const m=new Set(["INPUT","SELECT","TEXTAREA","OPTION"]),f=new Set(["radio","checkbox"]);class y{nodes=[];value;boundNodes=[];removeNodes(){this.nodes.forEach((e=>e.parentNode.removeChild(e))),this.nodes.splice(0)}update(e,t){this.boundNodes.forEach((s=>s.update(e,t)))}init(){this.boundNodes.forEach((e=>e.init()))}}class g{node;get element(){return s.toElement(this.node)}get template(){return s.toTemplate(this.node)}get component(){return this.node instanceof H?this.node:s.raise(`node ${this.node} is not component`)}get input(){return s.toInput(this.node)}parentComponent;viewModelProxy;loopNode;viewModelIndex;defaultProperty;defaultEvent="click";viewModelPropByProp=new Map;propsByViewModelPath=new Map;pathsByProp=new Map;loopViewModelProp=null;loopChildren=[];viewModelHandlerByEvent=new Map;constructor(e,t,o){this.parentComponent=e,this.node=t,this.loopNode=o,this.viewModelProxy=e?.viewModelProxy??null,this.defaultProperty=(e=>{if(e instanceof HTMLElement){const t=s.toElement(e);return m.has(t.tagName)?f.has(t.type)?"checked":"value":"textContent"}return"textContent"})(t)}#t(){const e=this.template,t=this,s=this.viewModelProxy,o=this.loopViewModelProp,n=this.loopChildren,i=this.parentComponent,r=document.createDocumentFragment(),a=c.getValue(s,o);for(const[s,c]of Object.entries(a)){const a=new y,p=0===o.level?[s]:o.indexes.concat(s),l=document.importNode(e.content,!0),d=P.select(i,l,e,t,p);n.push(a),a.boundNodes.push(...Array.from(d)),a.nodes.push(...Array.from(l.childNodes)),a.value=c,r.appendChild(l)}e.after(r)}#s(){this.loopChildren.forEach((e=>e.removeNodes())),this.loopChildren=[],this.#t();for(const e of this.loopChildren)e.init()}#o(e){const t=e.trim();this.loopViewModelProp=c.create(t,this.viewModelIndexes)}#n(e,t,s,o,n={}){const i=this.viewModelPropByProp,r=this.propsByViewModelPath,a=this.pathsByProp,p=c.create(t,s);i.set(e,{viewModelProp:p,filters:o});const l=r.get(p.path);if(l?l.push(e):r.set(p.path,[e]),!a.has(e)){const t=e.split(".");let[s,o]=[null,null];2===t.length&&"class"===t[0]?[s,o]=[this.#i,this.#r]:"radio"===e?[s,o]=[this.#a,this.#c]:"checkbox"===e?[s,o]=[this.#p,this.#l]:"file"===e?[s,o]=[this.#d,this.#h]:1===t.length?[s,o]=[this.#u,this.#m]:2===t.length?[s,o]=[this.#f,this.#y]:console.error(`unknown property name ${e}`),a.set(e,{updateNodeFunc:s,updateViewModelFunc:o,paths:t})}if(this.node instanceof H){const t=this.component,s=this.viewModelProxy;"dialog"in t.dataset?Object.defineProperty(t.viewModel,e,{get:()=>Reflect.get(n,p.prop),set:e=>Reflect.set(n,p.prop,e)}):s?(t.viewModelProxy.$addImportProp(e),Object.defineProperty(t.viewModel,e,{get:()=>c.getValue(s,p),set:e=>c.setValue(s,p,e)})):Object.defineProperty(t.viewModel,e,{get:()=>Reflect.get(v,p.prop),set:e=>Reflect.set(v,p.prop,e)})}}#g(e){const t=this.viewModelIndexes,s=this.viewModelHandlerByEvent;p.parseBinds(e??"",this.defaultProperty).forEach((([e,o,n])=>{if(e.startsWith("on")){const n=c.create(o,t);s.set(e,n)}else this.#n(e,o,t,n)}))}#w(e){const t=this.viewModelIndexes;p.parseBinds(e??"",this.defaultProperty).forEach((([e,s,o])=>{this.#n(e,s,t,o)}))}parse(e,t={}){this.viewModelIndexes=e;const s=this.node;if(s instanceof Comment){this.#w(s.textContent.slice(2));const e=document.createTextNode("");s.parentNode.replaceChild(e,s),this.node=e}else{const s=this.element;if(s instanceof HTMLTemplateElement)"bind"in s.dataset&&(this.#o(s.dataset.bind),this.#t());else if("dialog"in s.dataset)for(const s of Object.keys(t)){const o=s;this.#n(s,o,e,[],t)}else"bind"in s.dataset&&this.#g(s.dataset.bind)}}#u(e,t,s,o,n,i){const r=h.applyForOutput(c.getValue(e,t),i);a.current.updateNode(s,[o],(()=>{s[o]=r}))}#f(e,t,s,o,n,i){const r=h.applyForOutput(c.getValue(e,t),i);a.current.updateNode(s,n,(()=>{s[n[0]][n[1]]=r}))}#i(e,t,o,n,i,r){const p=s.toElement(o),l=h.applyForOutput(c.getValue(e,t),r);a.current.updateNode(o,["classList"],(()=>{l?p.classList.add(i[1]):p.classList.remove(i[1])}))}#a(e,t,o,n,i,r){const p=s.toElement(o),l=h.applyForOutput(c.getValue(e,t),r);a.current.updateNode(o,["checked"],(()=>{p.checked=p.value==l}))}#p(e,t,o,n,i,r){const p=s.toElement(o),l=h.applyForOutput(c.getValue(e,t),r);a.current.updateNode(o,["checked"],(()=>{p.checked=!!l.find((e=>e==p.value))}))}#d(e,t,s,o,n,i){}#P(e,t,o,n,i){if(!(this.node instanceof H)){const{paths:r,updateNodeFunc:a}=this.pathsByProp.get(n);return!a&&s.raise(`unknown property ${n}`),Reflect.apply(a,this,[e,t,o,n,r,i])}{const e=this.node;a.current.notify(e,n,[])}}#m(e,t,s,o,n,i){c.setValue(o,n,h.applyForInput(e[t],i))}#y(e,t,s,o,n,i){c.setValue(o,n,h.applyForInput(e[s[0]][s[1]],i))}#r(e,t,s,o,n,i){}#c(e,t,o,n,i,r){const a=s.toElement(e);a.checked&&c.setValue(n,i,h.applyForInput(a.value,r))}#l(e,t,o,n,i,r){const a=s.toElement(e),p=c.getValue(n,i),l=h.applyForInput(a.value,r);if(a.checked)p.push(l);else{const e=p.findIndex((e=>e==l));e>=0&&p.splice(e,1)}}async#h(e,t,o,n,i,r){const a=s.toInput(e);if(0==a.files.length)return;const p=new u,l=await p.readAsText(a.files[0]),d=h.applyForInput(l,r);c.setValue(n,i,d)}#x(e,t,o,n,i){const{paths:r,updateViewModelFunc:a}=this.pathsByProp.get(t);return!a&&s.raise(`unknown property ${t}`),Reflect.apply(a,this,[e,t,r,o,n,i])}init(){const e=this.parentComponent,t=this.node,s=this.viewModelProxy,o=this.viewModelIndexes,n=this.defaultProperty,i=this.pathsByProp;if(t instanceof Text){for(const[e,{viewModelProp:o,filters:n}]of this.viewModelPropByProp.entries())this.#P(s,o,t,e,n);return}const r=this.element;if(!this.viewModelHandlerByEvent.has("input")){const e=i.has("file")?"file":i.has("radio")?"radio":i.has("checkbox")?"checkbox":n,{viewModelProp:o,filters:c}=this.viewModelPropByProp.get(e)??{};null!=o&&r.addEventListener("input",(n=>{n.stopPropagation(),a.current.asyncProc((()=>this.#x(t,e,s,o,c)),this,[])}))}for(const[t,n]of this.viewModelHandlerByEvent.entries()){const i=t.slice(2);r.addEventListener(i,(t=>{t.stopPropagation(),a.current.asyncProc((()=>e.stackIndexes.push(o,(()=>Reflect.apply(s[n.path],s,[t,...o])))),this,[])}))}for(const[e,{viewModelProp:o,filters:n}]of this.viewModelPropByProp.entries())this.#P(s,o,t,e,n);this.loopChildren.forEach((e=>e.init()))}update(e,t){if(null!=this.loopViewModelProp)e.has(this.loopViewModelProp.path)?this.#s():this.loopChildren.forEach((s=>s.update(e,t)));else{const s=this.node,o=this.viewModelProxy;for(const[n,i]of this.propsByViewModelPath.entries())(e.has(n)||t.has(n))&&i.forEach((e=>{const{viewModelProp:t,filters:n}=this.viewModelPropByProp.get(e);this.#P(o,t,s,e,n)}))}}static create(e,t,s=null){return new g(e,t,s)}}const w=e=>{const t=[];for(;null!=e.parentNode;)t.unshift(Array.from(e.parentNode.childNodes).indexOf(e)),e=e.parentNode;return t};class P{static listOfRouteIndexesByTemplate=new Map;static select(e,t,s,o=null,n=[]){const i=[],r=t=>{const s=g.create(e,t,o);s.parse(n),i.push(s)};if(this.listOfRouteIndexesByTemplate.has(s))this.listOfRouteIndexesByTemplate.get(s).map((e=>e.reduce(((e,t)=>e.childNodes[t]),t))).forEach((e=>r(e)));else{const e=[],o=[],n=Array.from(t.querySelectorAll("[data-bind]"));n.forEach((e=>{o.push(w(e))}));const i=[],a=e=>e.childNodes.forEach((e=>{e instanceof Comment&&e.textContent.startsWith("@@")&&i.push(e),a(e)}));a(t),i.map((e=>o.push(w(e)))),this.listOfRouteIndexesByTemplate.set(s,o),e.push(...n),e.push(...i),e.forEach((e=>r(e)))}return i}}const x=e=>e.init();class b{boundNodes=[];component;constructor(e){this.component=e}add(e){this.boundNodes.push(e)}bind(e){this.boundNodes.push(...P.select(this.component,e,this.component.template))}init(){this.boundNodes.forEach(x)}update(e,t){this.boundNodes.forEach(((e,t)=>s=>s.update(e,t))(e,t))}async walk(e){const t=async s=>{for(const o of s){await e(o);for(const e of o.loopChildren)await t(e.boundNodes)}};await t(this.boundNodes)}async findNode(e,t){await this.walk((async s=>{const o=Array.from(s.propsByViewModelPath.keys());for(const n of o.filter((t=>e.has(t))))await t(n,s.node)}))}static rootBinder=new b(null)}const v=new Proxy({},new class{set(e,t,s,o){return Reflect.set(e,t,s,o),b.rootBinder.update(new Set([t]),new Set([`$$${t}`])),!0}}),$=(e,t=e.viewModelProxy)=>e=>()=>Reflect.apply(e,t,[]),M=(e,t=e.viewModelProxy)=>e=>s=>Reflect.apply(e,t,[s]),N=class{static build(e,t=e.viewModel){const o=new Map,n=new Set(Object.keys(t).filter((e=>e.startsWith("__")))),i=new Set(Object.keys(t).filter((e=>"$"===e[0]&&"$"!==e[1]))),r=[],a=(s,i=null)=>{const r=s.split(".");if(r.length>1){const t=r.pop(),n=s.slice(0,-t.length-1);o.set(s,(e=>(t,s)=>({get:()=>((e,t=e.viewModelProxy)=>(s,o)=>()=>{const n=e.stackIndexes.current??[],i="*"===o?n.at(s.match(/\*/g)?.length):o;return t[s]?.[i]})(e)(t,s)(),set:o=>((e,t=e.viewModelProxy)=>(s,o)=>n=>{const i=e.stackIndexes.current??[],r="*"===o?i.at(s.match(/\*/g)?.length):o;return t[s][r]=n,!0})(e)(t,s)(o),enumerable:!0,configurable:!0}))(e)(n,t))}else{const r=s;if(r.startsWith("$$"))o.set(s,(e=>({get:()=>(e=>()=>{const t=e.slice(2);return v?.[t]})(e)(),set:t=>(e=>t=>{const s=e.slice(2);return v[s]=t,!0})(e)(t),enumerable:!0,configurable:!0}))(r));else{o.set(s,(e=>t=>({get:()=>((e,t=e.viewModelProxy)=>e=>()=>t?.[`__${e}`])(e)(t)(),set:s=>((e,t=e.viewModelProxy)=>e=>s=>(t[`__${e}`]=s,!0))(e)(t)(s),enumerable:!0,configurable:!0}))(e)(r));const a=`__${r}`;n.has(a)||(Object.defineProperty(t,a,(e=>({value:e,writable:!0,enumerable:!0,configurable:!0}))(i)),n.add(a))}}};for(const[e,s]of Object.entries(t))n.has(e)||i.has(e)||(s!==Symbol.for("import")?a(e,s):r.push(e));for(const[n,i]of Object.entries(Object.getOwnPropertyDescriptors(Object.getPrototypeOf(t)))){if("constructor"===n)continue;if(s.isFunction(i.value))continue;o.has(n)||a(n);const t=o.get(n);i.get&&(t.get=()=>$(e)(i.get)()),i.set&&(t.set=t=>M(e)(i.set)(t))}Object.keys(t).filter((e=>!n.has(e)&&!i.has(e))).forEach((e=>delete t[e]));for(const[e,s]of o.entries())Object.defineProperty(t,e,s),c.create(e);const p=Object.keys(t).concat(r),l=p.filter((e=>`${e}.*`in t)),d=new Map;return p.reduce(((e,t)=>{const s=`${t}.`;return e.set(t,new Set(p.filter((e=>e.startsWith(s))))),e}),d),{importProps:r,arrayProps:l,setOfRelativePropsByProp:d}}},C=Symbol.for("raw"),I=Symbol.for("isProxy"),E=new Set(["$getValue","$setValue","$init","$deleteCache","$asyncProc","$notify","$openDialog","$closeDialog","$cancelDialog","$addImportProp","$findNode"]),k=new Map;k.set("$indexes",(e=>e.component.stackIndexes.current)),k.set("$component",(e=>e.component)),k.set("$setOfImportProps",(e=>e.setOfImportProps)),k.set("$setOfArrayProps",(e=>e.setOfArrayProps)),k.set("$setOfRelativePropsByProp",(e=>e.setOfRelativePropsByProp));const R=new Set(["$1","$2","$3","$4","$5","$6","$7","$8","$indexes","$component","$setOfImportProps","$setOfArrayProps","$setOfRelativePropsByProp"]);class O extends Map{#b=!1;#v;constructor(e){super(),this.#v=e}has(e){const t=super.has(e);return this.#b&&!s.isSymbol(e)&&console.log(`cache.has(${e}) = ${t}, ${this.#v?.tagName}`),t}get(e){const t=super.get(e);return this.#b&&!s.isSymbol(e)&&console.log(`cache.get(${e}) = ${t}, ${this.#v?.tagName}`),t}delete(e){const t=super.delete(e);return this.#b&&!s.isSymbol(e)&&console.log(`cache.delete(${e}) = ${t}, ${this.#v?.tagName}`),t}set(e,t){if(s.isSymbol(e)||e.includes("*")||e.startsWith("__")||e.startsWith("$$"))return;if(this.#v.viewModelProxy.$setOfImportProps.has(e))return;if(s.isFunction(t))return;t=t?.[I]?t[C]:t;const o=super.set(e,t);return this.#b&&!s.isSymbol(e)&&console.log(`cache.set(${e}, ${t}) = ${o}, ${this.#v?.tagName}`),o}deleteRelative(e){this.delete(e);const t=`${e}.`;Array.from(this.keys()).filter((e=>e.startsWith(t))).forEach((e=>this.delete(e)))}}class V{component;prop;indexes;constructor(e,t){this.component=e,this.prop=t,this.indexes=e.stackIndexes.current?.slice(0)}get(e,t,s){return t===I||(t===C?e:Reflect.get(e,t,s))}set(e,t,s,o){return Reflect.set(e,t,s,o),"length"===t&&a.current.notify(this.component,this.prop,this.indexes??[]),!0}}const B=(e,t,s)=>(s=s?.[I]?s[C]:s)instanceof Array?new Proxy(s,new V(e,t)):s;class F{component;cache;importProps=[];setOfImportProps=new Set;arrayProps;setOfArrayProps;setOfRelativePropsByProp;constructor(e,t,s,o){this.component=e,this.#$(...t),this.cache=new O(e),this.arrayProps=s,this.setOfArrayProps=new Set(s),this.setOfRelativePropsByProp=o}#$(...e){this.importProps.push(...e),e.forEach((e=>this.setOfImportProps.add(e)))}$addImportProp(...e){e.pop(),e.pop(),Reflect.apply(this.#$,this,e)}$getValue(e,t,o,n,i){o=o??s.getPath(e,t);const r=this.cache,a=this.component;return r.has(o)?B(a,e,r.get(o)):a.stackIndexes.push(t,(function(){const t=Reflect.get(n,e,i);return r.set(o,t),B(a,e,t)}))}$setValue(e,t,o,n,i,r){o=o??s.getPath(e,t);const a=this.cache,c=(this.component,this.$notify),p=this;this.component.stackIndexes.push(t,(function(){return Reflect.set(i,e,n,r),a.deleteRelative(o),Reflect.apply(c,p,[e,t??[]]),!0}))}$asyncProc(...e){const t=e.pop();e.pop(),a.current.asyncProc(e[0],t,e[1]??[])}$notify(e,t){e.startsWith("__")||e.startsWith("$$")||this.setOfImportProps.has(e)||a.current.notify(this.component,e,t??[])}async $init(e,t){"$relativeProps"in e&&Reflect.get(e,"$relativeProps",t).forEach((([e,t])=>{t.forEach((t=>{const s=this.setOfRelativePropsByProp.get(t).add(e)??new Set([e]);this.setOfRelativePropsByProp.set(t,s)}))})),"$onInit"in e&&await Reflect.apply(e.$onInit,t,[])}$deleteCache(e){const t=this.cache;for(const s of Array.from(e))t.deleteRelative(s)}async $openDialog(...e){e.pop(),e.pop();const[t,s={}]=e,o=this.component;a.suspend(o);const n=z.tagName(t),i=document.createElement("template");i.innerHTML=`<${n} data-dialog></${n}>`;const r=document.importNode(i.content,!0),c=r.querySelector(n);try{return await new Promise((async(e,t)=>{c.setDialogInfo(o,e,t,s),document.body.appendChild(r),await c.initializePromise}))}catch(e){}finally{document.body.removeChild(c),a.resume()}}$closeDialog(e){this.component.closeDialog(e)}$cancelDialog(){this.component.cancelDialog()}$findNode(e,t){this.component.binder.findNode(e,t)}setOfNames;get(e,t,o){if(E.has(t))return(...s)=>Reflect.apply(this[t],this,[...s,e,o]);if(R.has(t)){const e=k.get(t);return e?e(this):s.isSymbol(t)?Reflect.get(this,t):this.component.stackIndexes.current[parseInt(t.slice(1))-1]}if(this.cache.has(t))return B(this.component,t,this.cache.get(t));if(!(t in e))for(const s of c.expandableProperties){const n=s.regexp.exec(t);if(n){const i=n.slice(1);return this.$getValue(s.prop,i,t,e,o)}}const n=Reflect.get(e,t,o);return this.cache.set(t,n),B(this.component,t,n)}set(e,t,s,o){if(!(t in e))for(const n of c.expandableProperties){const i=n.regexp.exec(t);if(i){const r=i.slice(1);return this.$setValue(n.prop,r,t,s,e,o),!0}}Reflect.set(e,t,s,o),this.cache.deleteRelative(t);const n=this.component.stackIndexes.current;return this.$notify(t,n),!0}has(e,t,s){return!!E.has(t)||!!R.has(t)||t in e||Reflect.has(e,t,s)}}const A=Proxy,D=class{static create(e,t=e.viewModel){const{importProps:s,arrayProps:o,setOfRelativePropsByProp:n}=N.build(e);return new A(t,new F(e,s,o,n))}};class S{component;constructor(e){this.component=e}render(e=this.component,t=e.binder,s=e.template,o=e.shadowRoot){const n=document.importNode(s.content,!0);t.bind(n),t.init(),o.appendChild(n)}}class T extends S{get css(){return"\n.bg {\n  position: fixed;\n  display: flex;\n  align-items: center;\n  justify-content: space-around;\n  background-color: rgba(0, 0, 0, 0.5);\n  left: 0;\n  top: 0;\n  height: 100vh;\n  width: 100vw;\n  z-index: fixed;\n  position: fixed;\n  position: 499;\n}\n.fg {\n  background-color: white;\n  border-radius: .375rem;\n  padding: 3rem;\n}\n    "}render(e=this.component,t=e.binder,s=e.template,o=e.shadowRoot){const n=document.importNode(s.content,!0);t.bind(n),t.init();const i=document.createElement("style");i.innerHTML=this.css,o.appendChild(i);const r=document.createElement("div");r.classList.add("bg");const a=document.createElement("div");a.classList.add("fg"),r.appendChild(a),a.appendChild(n),o.appendChild(r),r.addEventListener("click",(()=>e.cancelDialog())),a.addEventListener("click",(e=>e.stopPropagation()))}}class L{stack=[];push(e,t){let s;this.stack.push(e);try{s=t()}finally{this.stack.pop()}return s}get current(){return this.stack.at(-1)}}class j extends HTMLElement{#M;#N;#C;#I;#E;#k;#R;#O;#V;template;viewModel;viewModelProxy;view;binder;stackIndexes;constructor(){super(),this.#E=!0,this.#N=new Promise(((e,t)=>{this.#C=e,this.#I=t}))}createView(){return"dialog"in this.dataset?new T(this):new S(this)}build(e){this.attachShadow({mode:"open"}),this.template=e.template,this.viewModel=Reflect.construct(e.ViewModel,[]),this.viewModelProxy=D.create(this),this.view=this.createView(),this.binder=new b(this),this.stackIndexes=new L}get parentComponent(){if(void 0===this.#M){let e=this;for(;(e=e.getRootNode()?.host??null,null!=e)&&!(e instanceof j););this.#M=e}return this.#M}set parentComponent(e){this.#M=e}get initializePromise(){return this.#N}get isInitializing(){return this.#E}setDialogInfo(e,t,s,o){this.#O=e,this.#k=t,this.#R=s,this.#V=o}get resolveForDialog(){return this.#k}get rejectForDialog(){return this.#R}get paramsForDialog(){return this.#V}get componentForDialog(){return this.#O}closeDialog(e){this.resolveForDialog(e)}cancelDialog(){this.rejectForDialog()}async dialogComponentInit(){a.current.asyncProc((async()=>{const e=g.create(this.componentForDialog,this);e.parse([],this.paramsForDialog),await this.viewModelProxy.$init(),e.init(),this.view.render()}),this,[])}async topComponentInit(){a.current.asyncProc((async()=>{const e=g.create(null,this);e.parse([]),await this.viewModelProxy.$init(),e.init(),b.rootBinder.add(e),this.view.render()}),this,[])}async defaultComponentInit(){a.current.asyncProc((async()=>{await this.parentComponent.initializePromise,await this.viewModelProxy.$init(),this.view.render()}),this,[])}async componentInit(){try{"dialog"in this.dataset?await this.dialogComponentInit():null==this.parentComponent?await this.topComponentInit():await this.defaultComponentInit()}finally{this.#E=!1,this.#C(!0)}}async connectedCallback(){await this.componentInit()}disconnectedCallback(){}adoptedCallback(){}attributeChangedCallback(e,t,s){}}class q extends Map{set(e,t){super.set(e.toUpperCase(),t),customElements.define(e,class extends H{})}}class H extends j{constructor(){super(),super.build(z.getComponentDataByTagName(this.tagName))}}class z{static#B;static get prefix(){return this.#B}static set prefix(e){this.#B=e}static tagName(e){return this.#B?`${this.#B}-${e}`:e}static#F=new q;static getComponentDataByTagName(e){return this.#F.get(e)}static registComponentData(e,t){this.#F.set(s.toKebabCase(e),t)}}class _{html;css;template;ViewModel;static create(e){const t=Object.assign(new _,e);return t.template=t.template??this.createTemplate(this.mergeHtml(t.html,t.css)),t}static mergeHtml(e,t){return(t?`<style>${t}</style>`:"")+((e=e.replaceAll(/\{([^\}]+)\}/g,((e,t)=>`\x3c!--@@${t}--\x3e`)))??"")}static createTemplate(e){const t=document.createElement("template");return t.innerHTML=e,t}}window.redatax=class{static prefix=e=>(z.prefix=e,this);static components=e=>{for(const[t,s]of Object.entries(e)){const e=_.create(s);z.registComponentData(z.tagName(t),e)}return this};static globals=e=>(Object.assign(v,e),this)}})();