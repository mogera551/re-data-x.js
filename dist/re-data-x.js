(()=>{"use strict";class e{target;thisArg;args;constructor(e,t,s){this.target=e,this.thisArg=t,this.args=s}async exec(e=this.target,t=this.thisArg,s=this.args){return await Reflect.apply(e,t,s)}}class t{queue=[];enqueue(e,t=this.queue){t.push(e)}async exec(e=this.queue){for(;;){const t=e.slice();if(0===t.length)break;e.splice(0);for(const e of t)await e.exec()}}}const s=class{static getPath(e,t){let s=0;return e.replaceAll("*",(()=>t[s++]??"*"))}static raise(e){throw e}static isFunction=e=>{const t=Object.prototype.toString.call(e).slice(8,-1).toLowerCase();return"function"===t||"asyncfunction"===t};static isSymbol=e=>"symbol"==typeof e;static toElement=e=>e instanceof HTMLElement?e:utils.raise(`node ${e} is not HTMLElement`);static toTemplate=e=>e instanceof HTMLTemplateElement?e:utils.raise(`node ${e} is not HTMLTemplateElement`);static toInput=e=>e instanceof HTMLInputElement?e:utils.raise(`node ${e} is not HTMLInputElement`);static toKebabCase=e=>e.replaceAll(/([A-Z])/g,((e,t,s)=>(s>0?"-":"")+t.toLowerCase()))};class o{component;prop;indexes;path;key;constructor(e,t,o){const n=o??[];this.component=e,this.prop=t,this.indexes=n,this.path=s.getPath(t,n),this.indexesKey=this.indexes.join("\t"),this.key=`${this.prop}\t${this.indexesKey}`}}class n{node;props;proc;constructor(e,t,s){this.node=e,this.props=t,this.proc=s}}class i{queue=[];enqueue(e,t=this.queue){t.push(e)}static reorder(e){const t=e.slice();return t.sort(((e,t)=>e.node instanceof HTMLSelectElement&&1===e.props.length&&"value"===e.props[0]?1:-1)),t}exec(e=this.queue){for(;;){const t=e.slice();if(0===t.length)break;e.splice(0);const s=i.reorder(t);for(const e of s)e.proc()}}}class a{asyncProc=new t;notify=new class{queue=[];component;constructor(e){this.component=e}enqueue(e,t=this.queue){e.component.isInitializing||t.push(e)}updateElements(e=this.queue){for(;;){const t=e.slice();if(0===t.length)break;e.splice(0);const s=new Map;t.forEach((e=>{s.has(e.component)||s.set(e.component,[]),s.get(e.component).push(e)}));for(let[e,t]of s.entries()){e?.updateActiveProperty();const s=e?.viewModelProxy,n=t=>{const n=s?.$setOfArrayProps??new Set,i=s?.$setOfRelativePropsByProp??new Set,a=new Set;for(const e of t){if(!n.has(e.prop))continue;const s=i[e.prop]??new Set;for(const e of t)s.has(e.prop)&&a.add(e)}t=t.filter((e=>!a.has(e)));const r=[];("$onNotify"in s??1)&&r.push(...Array.from(t).flatMap((e=>s.$onNotify(e))).filter((e=>null!=e)).map((t=>new o(e,t.prop,t?.indexes))));for(const s of t){let t=new Set;if(n.has(s.prop)){const e=`${s.prop}.*.`;i.get(s.prop)?.forEach((s=>!s.startsWith(e)&&t.add(s)))}else t=i.get(s.prop)??new Set;r.push(...Array.from(t).map((t=>new o(e,t,s?.indexes))))}return r},i=[t];let a=t;for(;;){const e=n(a);if(0===e.length)break;i.push(e),a=e}const r=i.flatMap((e=>e)),c=new Map;r.reduce(((e,t)=>e.set(t.path,t)),c);const p=new Set(c.keys());s.$deleteCache(p),e.binder.update(p,new Set),("$onChange"in s??1)&&s.$asyncProc((async()=>{await s.$onChange(Array.from(c.values()))}))}}}};updateNodeScheduler=new i;constructor(){}enqueueAsyncProc(e){this.asyncProc.enqueue(e)}enqueueNotify(e){this.notify.enqueue(e)}enqueueUpdateNode(e){this.updateNodeScheduler.enqueue(e)}async exec(){for(;await this.asyncProc.exec(),this.notify.updateElements(),this.updateNodeScheduler.exec(),0!=this.asyncProc.queue.length||0!=this.notify.queue.length||0!=this.updateNodeScheduler.queue.length;);}}class r{resolve;reject;updator;component;constructor(e=null){this.component=e,this.main()}wakeup(e){this.resolve(e)}stop(){this.reject()}sleep(){return new Promise(((e,t)=>{this.resolve=e,this.reject=t}))}async main(){for(;;)try{this.updator=await this.sleep();try{console.time("update"),await this.updator.exec(),console.timeEnd("update")}finally{this.updator=null}}catch(e){if(void 0!==e&&(console.error(e),!confirm("致命的エラーが発生しました。継続しますか？")))break}}asyncProc(t,s,o){const n=this.updator??new a;n.enqueueAsyncProc(new e(t,s,o)),this.updator||this.wakeup(n)}notify(e,t,s){const n=this.updator??new a;n.enqueueNotify(new o(e,t,s)),this.updator||this.wakeup(n)}updateNode(e,t,s){const o=this.updator??new a;o.enqueueUpdateNode(new n(e,t,s)),this.updator||this.wakeup(o)}static queue=[new r];static get current(){return this.queue.at(-1)}static suspend(e){this.queue.push(new r(e))}static resume(){this.queue.pop().stop()}}class c{prop;indexes;path;regexp;level;constructor(e,t,s,o=!1){this.prop=e,this.indexes=t?.slice(0)??[],this.path=s,this.isExpandable=o,this.regexp=o?new RegExp("^"+this.prop.replaceAll("*","(\\w+)").replaceAll(".","\\.")+"$"):null,this.level=this.prop.match(/\*/g)?.length??0,this.propIndexes=this.indexes.slice(-this.level)??[];const n=s.split(".").slice(-1),i=[n.join(".")];for(let e=1;e<n.length;e++)i.push(n.slice(0,-e).join("."));this.setOfParentPaths=new Set(i)}static getValue(e,t){return e.$getValue(t.prop,t.indexes,t.path)}static setValue(e,t,s){return e.$setValue(t.prop,t.indexes,t.path,s),!0}static cache=new Map;static expandableProperties=[];static create(e,t=null){const o=t?s.getPath(e,t):e,n=e===o&&e.includes("*"),i=new c(e,t,o,n);return n&&this.expandableProperties.push(i),i}}const p=class{static cache=new Map;static trim=e=>e.trim();static has=e=>e.length>0;static parseFilter=e=>{const[t,...s]=e.split(",").map(this.trim);return Object.assign(new class{name;options},{name:t,options:s})};static parseViewModelProp=e=>{const[t,...s]=e.split("|").map(this.trim);return[t,s.map((e=>this.parseFilter(e)))]};static parseBind=(e,t)=>{const[s,o]=[t].concat(...e.split(":").map(this.trim)).splice(-2),[n,i]=this.parseViewModelProp(o);return[s,n,i]};static parseBinds=(e,t)=>{const s=`${e}\t${t}`;if(this.cache.has(s))return this.cache.get(s);{const o=e.split(";").map(this.trim).filter(this.has).map((e=>this.parseBind(e,"$"))).map((([e,s,o])=>(s="@"===s?e:s,[e="$"===e?t:e,s,o])));return this.cache.set(s,o),o}}};class l{static localeString=(e,t)=>null!=e?Number(e).toLocaleString():"";static fixed=(e,t)=>e?.toFixed(t[0]??0)??"";static styleDisplay=(e,t)=>e?t[0]??"":"none";static truthy=(e,t)=>!!e;static falsey=(e,t)=>!e;static not=this.falsey;static upperCase=(e,t)=>e?.toUpperCase()??"";static lowerCase=(e,t)=>e?.toLowerCase()??"";static eq=(e,t)=>e==t[0];static ne=(e,t)=>e!=t[0];static lt=(e,t)=>Number(e)<Number(t[0]);static le=(e,t)=>Number(e)<=Number(t[0]);static gt=(e,t)=>Number(e)>Number(t[0]);static ge=(e,t)=>Number(e)>=Number(t[0]);static embed=(e,t)=>decodeURI((t[0]??"").replaceAll("%s",e));static ifText=(e,t)=>e?t[0]??"":t[1]??"";static null=(e,t)=>null==e}class h{}class d{static applyForInput=(e,t)=>t.reduceRight(((e,t)=>t.name in h?h[t.name](e,t.options):e),e);static applyForOutput=(e,t)=>t.reduce(((e,t)=>t.name in l?l[t.name](e,t.options):e),e)}class u extends FileReader{constructor(){super()}#e(e,t){return new Promise(((s,o)=>{super.addEventListener("load",(({target:e})=>s(e.result))),super.addEventListener("error",(({target:e})=>o(e.error))),super[t](e)}))}readAsArrayBuffer(e){return this.#e(e,"readAsArrayBuffer")}readAsDataURL(e){return this.#e(e,"readAsDataURL")}readAsText(e){return this.#e(e,"readAsText")}}const m=new Set(["INPUT","SELECT","TEXTAREA","OPTION"]),f=new Set(["radio","checkbox"]);class y{nodes=[];value;boundNodes=[];removeNodes(){this.nodes.forEach((e=>e.parentNode.removeChild(e))),this.nodes.splice(0)}update(e,t){this.boundNodes.forEach((s=>s.update(e,t)))}init(){this.boundNodes.forEach((e=>e.init()))}}class P{node;get element(){return s.toElement(this.node)}get template(){return s.toTemplate(this.node)}get component(){return this.node instanceof _?this.node:s.raise(`node ${this.node} is not component`)}get input(){return s.toInput(this.node)}parentComponent;viewModelProxy;loopNode;viewModelIndex;defaultProperty;defaultEvent="click";viewModelPropByProp=new Map;propsByViewModelPath=new Map;pathsByProp=new Map;loopViewModelProp=null;loopChildren=[];viewModelHandlerByEvent=new Map;constructor(e,t,o){this.parentComponent=e,this.node=t,this.loopNode=o,this.viewModelProxy=e?.viewModelProxy??null,this.defaultProperty=(e=>{if(e instanceof HTMLElement){const t=s.toElement(e);return m.has(t.tagName)?f.has(t.type)?"checked":"value":"textContent"}return"textContent"})(t)}#t(){const e=this.template,t=this,s=this.viewModelProxy,o=this.loopViewModelProp,n=this.loopChildren,i=this.parentComponent,a=document.createDocumentFragment(),r=c.getValue(s,o);for(const[s,c]of Object.entries(r)){const r=new y,p=0===o.level?[s]:o.indexes.concat(s),l=document.importNode(e.content,!0),h=w.select(i,l,e,t,p);n.push(r),r.boundNodes.push(...Array.from(h)),r.nodes.push(...Array.from(l.childNodes)),r.value=c,a.appendChild(l)}e.after(a)}#s(){this.loopChildren.forEach((e=>e.removeNodes())),this.loopChildren=[],this.#t();for(const e of this.loopChildren)e.init()}#o(e){const t=e.trim();this.loopViewModelProp=c.create(t,this.viewModelIndexes)}#n(e,t,s,o,n={}){const i=this.viewModelPropByProp,a=this.propsByViewModelPath,r=this.pathsByProp,p=c.create(t,s);i.set(e,{viewModelProp:p,filters:o});const l=a.get(p.path);if(l?l.push(e):a.set(p.path,[e]),!r.has(e)){const t=e.split(".");let[s,o]=[null,null];2===t.length&&"class"===t[0]?[s,o]=[this.#i,this.#a]:"radio"===e?[s,o]=[this.#r,this.#c]:"checkbox"===e?[s,o]=[this.#p,this.#l]:"file"===e?[s,o]=[this.#h,this.#d]:1===t.length?[s,o]=[this.#u,this.#m]:2===t.length?[s,o]=[this.#f,this.#y]:console.error(`unknown property name ${e}`),r.set(e,{updateNodeFunc:s,updateViewModelFunc:o,paths:t})}if(this.node instanceof _){const t=this.component,s=this.viewModelProxy;"dialog"in t.dataset?Object.defineProperty(t.viewModel,e,{get:()=>Reflect.get(n,p.prop),set:e=>Reflect.set(n,p.prop,e)}):s?(t.viewModelProxy.$addImportProp(e),Object.defineProperty(t.viewModel,e,{get:()=>c.getValue(s,p),set:e=>c.setValue(s,p,e)})):Object.defineProperty(t.viewModel,e,{get:()=>Reflect.get(b,p.prop),set:e=>Reflect.set(b,p.prop,e)})}}#P(e){const t=this.viewModelIndexes,s=this.viewModelHandlerByEvent;p.parseBinds(e??"",this.defaultProperty).forEach((([e,o,n])=>{if(e.startsWith("on")){const n=c.create(o,t);s.set(e,n)}else this.#n(e,o,t,n)}))}#g(e){const t=this.viewModelIndexes;p.parseBinds(e??"",this.defaultProperty).forEach((([e,s,o])=>{this.#n(e,s,t,o)}))}parse(e,t={}){this.viewModelIndexes=e;const s=this.node;if(s instanceof Comment){this.#g(s.textContent.slice(2));const e=document.createTextNode("");s.parentNode.replaceChild(e,s),this.node=e}else{const s=this.element;if(s instanceof HTMLTemplateElement)"bind"in s.dataset&&(this.#o(s.dataset.bind),this.#t());else if("dialog"in s.dataset)for(const s of Object.keys(t)){const o=s;this.#n(s,o,e,[],t)}else"bind"in s.dataset&&this.#P(s.dataset.bind)}}#u(e,t,s,o,n,i){const a=d.applyForOutput(c.getValue(e,t),i);r.current.updateNode(s,[o],(()=>{s[o]=a}))}#f(e,t,s,o,n,i){const a=d.applyForOutput(c.getValue(e,t),i);r.current.updateNode(s,n,(()=>{s[n[0]][n[1]]=a}))}#i(e,t,o,n,i,a){const p=s.toElement(o),l=d.applyForOutput(c.getValue(e,t),a);r.current.updateNode(o,["classList"],(()=>{l?p.classList.add(i[1]):p.classList.remove(i[1])}))}#r(e,t,o,n,i,a){const p=s.toElement(o),l=d.applyForOutput(c.getValue(e,t),a);r.current.updateNode(o,["checked"],(()=>{p.checked=p.value==l}))}#p(e,t,o,n,i,a){const p=s.toElement(o),l=d.applyForOutput(c.getValue(e,t),a);r.current.updateNode(o,["checked"],(()=>{p.checked=!!l.find((e=>e==p.value))}))}#h(e,t,s,o,n,i){}#w(e,t,o,n,i){if(!(this.node instanceof _)){const{paths:a,updateNodeFunc:r}=this.pathsByProp.get(n);return!r&&s.raise(`unknown property ${n}`),Reflect.apply(r,this,[e,t,o,n,a,i])}{const e=this.node;r.current.notify(e,n,[])}}#m(e,t,s,o,n,i){c.setValue(o,n,d.applyForInput(e[t],i))}#y(e,t,s,o,n,i){c.setValue(o,n,d.applyForInput(e[s[0]][s[1]],i))}#a(e,t,s,o,n,i){}#c(e,t,o,n,i,a){const r=s.toElement(e);r.checked&&c.setValue(n,i,d.applyForInput(r.value,a))}#l(e,t,o,n,i,a){const r=s.toElement(e),p=c.getValue(n,i),l=d.applyForInput(r.value,a);if(r.checked)p.push(l);else{const e=p.findIndex((e=>e==l));e>=0&&p.splice(e,1)}}async#d(e,t,o,n,i,a){const r=s.toInput(e);if(0==r.files.length)return;const p=new u,l=await p.readAsText(r.files[0]),h=d.applyForInput(l,a);c.setValue(n,i,h)}#x(e,t,o,n,i){const{paths:a,updateViewModelFunc:r}=this.pathsByProp.get(t);return!r&&s.raise(`unknown property ${t}`),Reflect.apply(r,this,[e,t,a,o,n,i])}init(){const e=this.parentComponent,t=this.node,s=this.viewModelProxy,o=this.viewModelIndexes,n=this.defaultProperty,i=this.pathsByProp;if(t instanceof Text){for(const[e,{viewModelProp:o,filters:n}]of this.viewModelPropByProp.entries())this.#w(s,o,t,e,n);return}const a=this.element;if(!this.viewModelHandlerByEvent.has("input")){const e=i.has("file")?"file":i.has("radio")?"radio":i.has("checkbox")?"checkbox":n,{viewModelProp:o,filters:c}=this.viewModelPropByProp.get(e)??{};null!=o&&a.addEventListener("input",(n=>{n.stopPropagation(),r.current.asyncProc((()=>this.#x(t,e,s,o,c)),this,[])}))}for(const[t,n]of this.viewModelHandlerByEvent.entries()){const i=t.slice(2);a.addEventListener(i,(t=>{t.stopPropagation(),r.current.asyncProc((()=>e.stackIndexes.push(o,(()=>Reflect.apply(s[n.path],s,[t,...o])))),this,[])}))}for(const[e,{viewModelProp:o,filters:n}]of this.viewModelPropByProp.entries())this.#w(s,o,t,e,n);this.loopChildren.forEach((e=>e.init()))}update(e,t){if(null!=this.loopViewModelProp)e.has(this.loopViewModelProp.path)?this.#s():this.loopChildren.forEach((s=>s.update(e,t)));else{const s=this.node,o=this.viewModelProxy;for(const[n,i]of this.propsByViewModelPath.entries())(e.has(n)||t.has(n))&&i.forEach((e=>{const{viewModelProp:t,filters:n}=this.viewModelPropByProp.get(e);this.#w(o,t,s,e,n)}))}}static create(e,t,s=null){return new P(e,t,s)}}const g=e=>{const t=[];for(;null!=e.parentNode;)t.unshift(Array.from(e.parentNode.childNodes).indexOf(e)),e=e.parentNode;return t};class w{static listOfRouteIndexesByTemplate=new Map;static select(e,t,s,o=null,n=[]){const i=[],a=t=>{const s=P.create(e,t,o);s.parse(n),i.push(s)};if(this.listOfRouteIndexesByTemplate.has(s))this.listOfRouteIndexesByTemplate.get(s).map((e=>e.reduce(((e,t)=>e.childNodes[t]),t))).forEach((e=>a(e)));else{const e=[],o=[],n=Array.from(t.querySelectorAll("[data-bind]"));n.forEach((e=>{o.push(g(e))}));const i=[],r=e=>e.childNodes.forEach((e=>{e instanceof Comment&&e.textContent.startsWith("@@")&&i.push(e),r(e)}));r(t),i.map((e=>o.push(g(e)))),this.listOfRouteIndexesByTemplate.set(s,o),e.push(...n),e.push(...i),e.forEach((e=>a(e)))}return i}}const x=e=>e.init();class v{boundNodes=[];component;constructor(e){this.component=e}add(e){this.boundNodes.push(e)}bind(e){this.boundNodes.push(...w.select(this.component,e,this.component.template))}init(){this.boundNodes.forEach(x)}update(e,t){this.boundNodes.forEach(((e,t)=>s=>s.update(e,t))(e,t))}async walk(e){const t=async s=>{for(const o of s){await e(o);for(const e of o.loopChildren)await t(e.boundNodes)}};await t(this.boundNodes)}async findNode(e,t){await this.walk((async s=>{const o=Array.from(s.propsByViewModelPath.keys());for(const n of o.filter((t=>e.has(t))))await t(n,s.node)}))}static rootBinder=new v(null)}const b=new Proxy({},new class{set(e,t,s,o){return Reflect.set(e,t,s,o),v.rootBinder.update(new Set([t]),new Set([`$$${t}`])),!0}});class M{name;paths=[];level;regexp;constructor(e){this.name=e,this.paths=e.split("."),this.last=this.paths.at(-1),this.level=e.match(/\*/g)?.length??0,this.regexp=this.level>0?new RegExp("^"+e.replaceAll("*","(\\w+)").replaceAll(".","\\.")+"$"):null,this.listParentPaths=[];for(let e=1;e<this.paths.length;e++)this.listParentPaths.push(this.paths.slice(0,-e));this.parentPathsByPath=new Map,this.setOfParentPath=new Set,this.setOfExpandPath=new Set,this.listParentPaths.forEach((e=>{const t=e.join(".");this.setOfParentPath.add(t),"*"===t.at(-1)&&this.setOfExpandPath.add(t.slice(0,-2)),this.parentPathsByPath.set(t,e)})),this.parentPaths=this.listParentPaths[0]??[],this.parentPath=this.parentPaths.join(".")}getNameByIndexes(e){return s.getPath(this.name,e)}static propByName=new Map;static create(e){if(this.propByName.has(e))return this.propByName.get(e);{const t=new M(e);return this.propByName.set(e,t),t}}}const $=(e,t=e.viewModelProxy)=>e=>()=>Reflect.apply(e,t,[]),N=(e,t=e.viewModelProxy)=>e=>s=>Reflect.apply(e,t,[s]),B=class{static build(e,t=e.viewModel){const o=new Map,n=new Set(Object.keys(t).filter((e=>e.startsWith("__")))),i=new Set(Object.keys(t).filter((e=>"$"===e[0]&&"$"!==e[1]))),a=[],r=(s,i=null)=>{const a=s.split(".");if(a.length>1){const t=a.pop(),n=s.slice(0,-t.length-1);o.set(s,(e=>(t,s)=>({get:()=>((e,t=e.viewModelProxy)=>(s,o)=>()=>{const n=e.stackIndexes.current??[],i="*"===o?n.at(s.match(/\*/g)?.length):o;return t[s]?.[i]})(e)(t,s)(),set:o=>((e,t=e.viewModelProxy)=>(s,o)=>n=>{const i=e.stackIndexes.current??[],a="*"===o?i.at(s.match(/\*/g)?.length):o;return t[s][a]=n,!0})(e)(t,s)(o),enumerable:!0,configurable:!0}))(e)(n,t))}else{const a=s;if(a.startsWith("$$"))o.set(s,(e=>({get:()=>(e=>()=>{const t=e.slice(2);return b?.[t]})(e)(),set:t=>(e=>t=>{const s=e.slice(2);return b[s]=t,!0})(e)(t),enumerable:!0,configurable:!0}))(a));else{o.set(s,(e=>t=>({get:()=>((e,t=e.viewModelProxy)=>e=>()=>t?.[`__${e}`])(e)(t)(),set:s=>((e,t=e.viewModelProxy)=>e=>s=>(t[`__${e}`]=s,!0))(e)(t)(s),enumerable:!0,configurable:!0}))(e)(a));const r=`__${a}`;n.has(r)||(Object.defineProperty(t,r,(e=>({value:e,writable:!0,enumerable:!0,configurable:!0}))(i)),n.add(r))}}};for(const[e,s]of Object.entries(t))n.has(e)||i.has(e)||(s!==Symbol.for("import")?r(e,s):a.push(e));for(const[n,i]of Object.entries(Object.getOwnPropertyDescriptors(Object.getPrototypeOf(t)))){if("constructor"===n)continue;if(s.isFunction(i.value))continue;o.has(n)||r(n);const t=o.get(n);i.get&&(t.get=()=>$(e)(i.get)()),i.set&&(t.set=t=>N(e)(i.set)(t))}Object.keys(t).filter((e=>!n.has(e)&&!i.has(e))).forEach((e=>delete t[e]));for(const[e,s]of o.entries())Object.defineProperty(t,e,s),c.create(e);const p=Object.keys(t).concat(a),l=p.filter((e=>`${e}.*`in t)),h=new Map;return p.reduce(((e,t)=>{const s=`${t}.`;return e.set(t,new Set(p.filter((e=>e.startsWith(s))))),e}),h),p.forEach((e=>M.create(e))),{importProps:a,arrayProps:l,setOfRelativePropsByProp:h}}},E=Symbol.for("raw"),C=Symbol.for("isProxy"),I=new Set(["$getValue","$setValue","$init","$deleteCache","$asyncProc","$notify","$openDialog","$closeDialog","$cancelDialog","$addImportProp","$findNode"]),O=new Map;O.set("$indexes",(e=>e.component.stackIndexes.current)),O.set("$component",(e=>e.component)),O.set("$setOfImportProps",(e=>e.setOfImportProps)),O.set("$setOfArrayProps",(e=>e.setOfArrayProps)),O.set("$setOfRelativePropsByProp",(e=>e.setOfRelativePropsByProp));const k=new Set(["$1","$2","$3","$4","$5","$6","$7","$8","$indexes","$component","$setOfImportProps","$setOfArrayProps","$setOfRelativePropsByProp"]);class R extends Map{#v=!1;#b;constructor(e){super(),this.#b=e}has(e){const t=super.has(e);return this.#v&&!s.isSymbol(e)&&console.log(`cache.has(${e}) = ${t}, ${this.#b?.tagName}`),t}get(e){const t=super.get(e);return this.#v&&!s.isSymbol(e)&&console.log(`cache.get(${e}) = ${t}, ${this.#b?.tagName}`),t}delete(e){const t=super.delete(e);return this.#v&&!s.isSymbol(e)&&console.log(`cache.delete(${e}) = ${t}, ${this.#b?.tagName}`),t}set(e,t){const o=this.#b.activePropertyByPath;o?.has(e)&&(o.get(e),t=t?.[C]?t[E]:t,super.set(e,t),this.#v&&!s.isSymbol(e)&&console.log(`cache.set(${e}, ${t}) = ${result}, ${this.#b?.tagName}`))}deleteRelative(e){const t=this.#b.activePropertyByPath;if(this.has(e)&&this.delete(e),t?.has(e)){const t=this.#b.activePropertiesByParentPath,s=(e,o=!1)=>{!o&&this.delete(e),(t.get(e)??[]).forEach((e=>{s(e.path)}))};s(e,!0)}}}class V{component;prop;indexes;constructor(e,t){this.component=e,this.prop=t,this.indexes=e.stackIndexes.current?.slice(0)}get(e,t,s){return t===C||(t===E?e:Reflect.get(e,t,s))}set(e,t,s,o){return Reflect.set(e,t,s,o),"length"===t&&r.current.notify(this.component,this.prop,this.indexes??[]),!0}}const A=(e,t,s)=>(s=s?.[C]?s[E]:s)instanceof Array?new Proxy(s,new V(e,t)):s;class S{component;cache;importProps=[];setOfImportProps=new Set;arrayProps;setOfArrayProps;setOfRelativePropsByProp;constructor(e,t,s,o){this.component=e,this.#M(...t),this.cache=new R(e),this.arrayProps=s,this.setOfArrayProps=new Set(s),this.setOfRelativePropsByProp=o}#M(...e){this.importProps.push(...e),e.forEach((e=>this.setOfImportProps.add(e)))}$addImportProp(...e){e.pop(),e.pop(),Reflect.apply(this.#M,this,e)}$getValue(e,t,o,n,i){o=o??s.getPath(e,t);const a=this.cache,r=this.component;return a.has(o)?A(r,e,a.get(o)):r.stackIndexes.push(t,(function(){const t=Reflect.get(n,e,i);return a.set(o,t),A(r,e,t)}))}$setValue(e,t,o,n,i,a){o=o??s.getPath(e,t);const r=this.cache,c=(this.component,this.$notify),p=this;this.component.stackIndexes.push(t,(function(){return Reflect.set(i,e,n,a),r.deleteRelative(o),Reflect.apply(c,p,[e,t??[]]),!0}))}$asyncProc(...e){const t=e.pop();e.pop(),r.current.asyncProc(e[0],t,e[1]??[])}$notify(e,t){e.startsWith("__")||e.startsWith("$")||this.setOfImportProps.has(e)||r.current.notify(this.component,e,t??[])}async $init(e,t){"$relativeProps"in e&&Reflect.get(e,"$relativeProps",t).forEach((([e,t])=>{t.forEach((t=>{const s=this.setOfRelativePropsByProp.get(t).add(e)??new Set([e]);this.setOfRelativePropsByProp.set(t,s)}))})),"$onInit"in e&&await Reflect.apply(e.$onInit,t,[])}$deleteCache(e){const t=this.cache;for(const s of Array.from(e))t.deleteRelative(s)}async $openDialog(...e){e.pop(),e.pop();const[t,s={}]=e,o=this.component;r.suspend(o);const n=U.tagName(t),i=document.createElement("template");i.innerHTML=`<${n} data-dialog></${n}>`;const a=document.importNode(i.content,!0),c=a.querySelector(n);try{return await new Promise((async(e,t)=>{c.setDialogInfo(o,e,t,s),document.body.appendChild(a),await c.initializePromise}))}catch(e){}finally{document.body.removeChild(c),r.resume()}}$closeDialog(e){this.component.closeDialog(e)}$cancelDialog(){this.component.cancelDialog()}$findNode(e,t){this.component.binder.findNode(e,t)}setOfNames;get(e,t,o){if(I.has(t))return(...s)=>Reflect.apply(this[t],this,[...s,e,o]);if(k.has(t)){const e=O.get(t);return e?e(this):s.isSymbol(t)?Reflect.get(this,t):this.component.stackIndexes.current[parseInt(t.slice(1))-1]}if(this.cache.has(t))return A(this.component,t,this.cache.get(t));if(!(t in e)&&this.component.activePropertyByPath.has(t)){const s=this.component.activePropertyByPath.get(t);return this.$getValue(s.name,s.indexes,s.path,e,o)}const n=Reflect.get(e,t,o);return this.cache.set(t,n),A(this.component,t,n)}set(e,t,s,o){if(!(t in e)&&this.component.activePropertyByPath.has(t)){const n=this.component.activePropertyByPath.get(t);return this.$setValue(n.name,n.indexes,n.path,s,e,o),!0}Reflect.set(e,t,s,o),this.cache.deleteRelative(t);const n=this.component.stackIndexes.current;return this.$notify(t,n),!0}has(e,t,s){return!!I.has(t)||!!k.has(t)||t in e||Reflect.has(e,t,s)}}const F=Proxy,D=class{static create(e,t=e.viewModel){const{importProps:s,arrayProps:o,setOfRelativePropsByProp:n}=B.build(e);return new F(t,new S(e,s,o,n))}};class j{component;constructor(e){this.component=e}render(e=this.component,t=e.binder,s=e.template,o=e.shadowRoot??e){const n=document.importNode(s.content,!0);t.bind(n),t.init(),o.appendChild(n)}}class T extends j{get css(){return"\n.bg {\n  position: fixed;\n  display: flex;\n  align-items: center;\n  justify-content: space-around;\n  background-color: rgba(0, 0, 0, 0.5);\n  left: 0;\n  top: 0;\n  height: 100vh;\n  width: 100vw;\n  z-index: fixed;\n  position: fixed;\n  position: 499;\n}\n.fg {\n  background-color: white;\n  border-radius: .375rem;\n  padding: 3rem;\n}\n    "}render(e=this.component,t=e.binder,s=e.template,o=e.shadowRoot??e){const n=document.importNode(s.content,!0);t.bind(n),t.init();const i=document.createElement("style");i.innerHTML=this.css,o.appendChild(i);const a=document.createElement("div");a.classList.add("bg");const r=document.createElement("div");r.classList.add("fg"),a.appendChild(r),r.appendChild(n),o.appendChild(a),a.addEventListener("click",(()=>e.cancelDialog())),r.addEventListener("click",(e=>e.stopPropagation()))}}class L{stack=[];push(e,t){let s;this.stack.push(e);try{s=t()}finally{this.stack.pop()}return s}get current(){return this.stack.at(-1)}}class q{definedProp;indexes;path;constructor(e,t,o=[]){this.definedProp=e,this.name=e.name,this.path=t,this.indexes=o,this.parentPath=s.getPath(e.parentPath,o)}static propByPath=new Map;static createByNameAndIndexes(e,t=[]){const o=s.getPath(e,t);if(this.propByPath.has(o))return this.propByPath.get(o);{const s=M.create(e),n=new q(s,o,t);return this.propByPath.set(o,n),n}}static buildByViewModel(e){const t=Object.keys(e).filter((e=>!(e=>"_"===e[0]&&"_"===e[1]||"$"===e[0])(e))).map((e=>M.create(e))),s=t.reduce(((e,t)=>null===e||e<t.level?t.level:e),null),o=new Map;for(let n=0;n<=s;n++){const s=t.filter((e=>e.level===n));0!==n?s.filter((e=>"*"===e.last)).forEach((t=>{const n=[t].concat(s.filter((e=>e.setOfExpandPath.has(t.parentPath))));if(o.has(t.parentPath)){const s=o.get(t.parentPath);n.forEach((t=>{const n=[];s.forEach((s=>{const o=e.$getValue(s.definedProp.name,s.indexes,s.path),i=Object.keys(o).map((e=>this.createByNameAndIndexes(t.name,s.indexes.concat(e))));n.push(...i)})),o.set(t.name,n)}))}else{const t=e.$getValue(expandProp.parentPath,[],expandProp.parentPath);n.forEach((e=>{const s=Object.keys(t).map((t=>this.createByNameAndIndexes(e.name,[t])));o.set(e.name,s)}))}})):s.forEach((e=>o.set(e.name,[this.createByNameAndIndexes(e.name)])))}const n=new Map(Array.from(o.values()).flatMap((e=>e)).map((e=>[e.path,e]))),i=new Map;return n.forEach((e=>{let t;i.has(e.parentPath)?t=i.get(e.parentPath):(t=[],i.set(e.parentPath,t)),t.push(e)})),{activePropertyByPath:n,activePropertiesByParentPath:i}}}class H extends HTMLElement{#$;#N;#B;#E;#C;#I;#O;#k;#R;template;viewModel;viewModelProxy;view;binder;stackIndexes;constructor(){super(),this.#C=!0,this.#N=new Promise(((e,t)=>{this.#B=e,this.#E=t}))}createView(){return"dialog"in this.dataset?new T(this):new j(this)}build(e){this.withoutShadowRoot||this.attachShadow({mode:"open"}),this.template=e.template,this.viewModel=Reflect.construct(e.ViewModel,[]),this.viewModelProxy=D.create(this),this.view=this.createView(),this.binder=new v(this),this.stackIndexes=new L}get parentComponent(){if(void 0===this.#$){let e=this;for(;e=e.parentNode,null!=e;){if(e instanceof ShadowRoot){e=e.host;break}if(e instanceof H)break}this.#$=e}return this.#$}set parentComponent(e){this.#$=e}get withoutShadowRoot(){return this.hasAttribute("without-shadowroot")}set withoutShadowRoot(e){e?this.setAttribute("without-shadowroot",""):this.removeAttribute("without-shadowroot")}get initializePromise(){return this.#N}get isInitializing(){return this.#C}setDialogInfo(e,t,s,o){this.#k=e,this.#I=t,this.#O=s,this.#R=o}get resolveForDialog(){return this.#I}get rejectForDialog(){return this.#O}get paramsForDialog(){return this.#R}get componentForDialog(){return this.#k}closeDialog(e){this.resolveForDialog(e)}cancelDialog(){this.rejectForDialog()}async dialogComponentInit(){r.current.asyncProc((async()=>{const e=P.create(this.componentForDialog,this);e.parse([],this.paramsForDialog),await this.viewModelProxy.$init(),e.init(),this.view.render()}),this,[])}async topComponentInit(){r.current.asyncProc((async()=>{const e=P.create(null,this);e.parse([]),await this.viewModelProxy.$init(),e.init(),v.rootBinder.add(e),this.view.render()}),this,[])}async defaultComponentInit(){r.current.asyncProc((async()=>{await this.parentComponent.initializePromise,await this.viewModelProxy.$init(),this.view.render()}),this,[])}async componentInit(){try{"dialog"in this.dataset?await this.dialogComponentInit():null==this.parentComponent?await this.topComponentInit():await this.defaultComponentInit(),this.updateActiveProperty()}finally{this.#C=!1,this.#B(!0)}}activePropertyByPath;activePropertiesByParentPath;updateActiveProperty(){const{activePropertyByPath:e,activePropertiesByParentPath:t}=q.buildByViewModel(this.viewModelProxy);Object.assign(this,{activePropertyByPath:e,activePropertiesByParentPath:t})}async connectedCallback(){await this.componentInit()}disconnectedCallback(){}adoptedCallback(){}attributeChangedCallback(e,t,s){}}class z extends Map{set(e,t){super.set(e.toUpperCase(),t),customElements.define(e,class extends _{})}}class _ extends H{constructor(){super(),super.build(U.getComponentDataByTagName(this.tagName))}}class U{static#V;static get prefix(){return this.#V}static set prefix(e){this.#V=e}static tagName(e){return this.#V?`${this.#V}-${e}`:e}static#A=new z;static getComponentDataByTagName(e){return this.#A.get(e)}static registComponentData(e,t){this.#A.set(s.toKebabCase(e),t)}}class W{html;css;template;ViewModel;static create(e){const t=Object.assign(new W,e);return t.template=t.template??this.createTemplate(this.mergeHtml(t.html,t.css)),t}static mergeHtml(e,t){return(t?`<style>${t}</style>`:"")+((e=e.replaceAll(/\{([^\}]+)\}/g,((e,t)=>`\x3c!--@@${t}--\x3e`)))??"")}static createTemplate(e){const t=document.createElement("template");return t.innerHTML=e,t}}window.redatax=class{static prefix=e=>(U.prefix=e,this);static components=e=>{for(const[t,s]of Object.entries(e)){const e=W.create(s);U.registComponentData(U.tagName(t),e)}return this};static globals=e=>(Object.assign(b,e),this)}})();