(()=>{"use strict";class e{target;thisArg;args;constructor(e,t,o){this.target=e,this.thisArg=t,this.args=o}}class t{queue=[];enqueue(e,t=this.queue){t.push(e)}async exec(e=this.queue){for(;;){const t=e.slice();if(0===t.length)break;e.splice(0);for(const e of t)await Reflect.apply(e.target,e.thisArg,e.args)}}}const o=class{static getPath(e,t){let o=0;return e.replaceAll("*",(()=>t[o++]??""))}static raise(e){throw e}static isFunction=e=>{const t=Object.prototype.toString.call(e).slice(8,-1).toLowerCase();return"function"===t||"asyncfunction"===t};static isSymbol=e=>"symbol"==typeof e;static toElement=e=>e instanceof HTMLElement?e:utils.raise(`node ${e} is not HTMLElement`);static toTemplate=e=>e instanceof HTMLTemplateElement?e:utils.raise(`node ${e} is not HTMLTemplateElement`);static toInput=e=>e instanceof HTMLInputElement?e:utils.raise(`node ${e} is not HTMLInputElement`);static toKebabCase=e=>e.replaceAll(/([A-Z])/g,((e,t,o)=>(o>0?"-":"")+t.toLowerCase()))};class s{component;prop;indexes;path;key;constructor(e,t,s){const n=s??[];this.component=e,this.prop=t,this.indexes=n,this.path=o.getPath(t,n),this.indexesKey=this.indexes.join("\t"),this.key=`${this.prop}\t${this.indexesKey}`}}const n=Symbol.for("onNotify"),i=Symbol.for("setOfArrayProps"),r=Symbol.for("setOfRelativePropsByProp"),a=Symbol.for("deleteCache");class c{node;props;proc;constructor(e,t,o){this.node=e,this.props=t,this.proc=o}}class p{queue=[];enqueue(e,t=this.queue){t.push(e)}static reorder(e){const t=e.slice();return t.sort(((e,t)=>e.node instanceof HTMLSelectElement&&1===e.props.length&&"value"===e.props[0]?1:-1)),t}exec(e=this.queue){for(;;){const t=e.slice();if(0===t.length)break;e.splice(0);const o=p.reorder(t);for(const e of o)e.proc()}}}class l{asyncProc=new t;notify=new class{queue=[];component;constructor(e){this.component=e}enqueue(e,t=this.queue){t.push(e)}updateElements(e=this.queue){for(;;){const t=e.slice();if(0===t.length)break;e.splice(0);const o=new Map;t.forEach((e=>{o.has(e.component)||o.set(e.component,[]),o.get(e.component).push(e)}));for(let[e,t]of o.entries()){const o=e?.viewModelProxy,c=o?.[i]??new Set,p=o?.[r]??new Set,l=new Set;for(const e of t){if(!c.has(e.prop))continue;const o=p[e.prop]??new Set;for(const e of t)o.has(e.prop)&&l.add(e)}if(t=t.filter((e=>!l.has(e))),n in o??1){const i=Array.from(t).flatMap((e=>o[n](e))).filter((e=>null!=e)).map((t=>new s(e,t.prop,t?.indexes)));t.push(...i)}const d=[];for(const o of t){if(c.has(o.prop))continue;const t=p.get(o.prop)??new Set;d.push(...Array.from(t).map((t=>new s(e,t,o?.indexes))))}t.push(...d);const h=new Set(t.map((e=>e.path)));o[a](h),e.binder.update(h,new Set)}}}};updateNodeScheduler=new p;constructor(){}enqueueAsyncProc(e){this.asyncProc.enqueue(e)}enqueueNotify(e){this.notify.enqueue(e)}enqueueUpdateNode(e){this.updateNodeScheduler.enqueue(e)}async exec(){for(;console.time("update.exec()"),await this.asyncProc.exec(),console.timeLog("update.exec()"),this.notify.updateElements(),console.timeLog("update.exec()"),this.updateNodeScheduler.exec(),console.timeEnd("update.exec()"),0!=this.asyncProc.queue.length||0!=this.notify.queue.length||0!=this.updateNodeScheduler.queue.length;);}}class d{resolve;reject;updator;component;constructor(e=null){this.component=e,this.main()}wakeup(e){this.resolve(e)}stop(){this.reject()}sleep(){return new Promise(((e,t)=>{this.resolve=e,this.reject=t}))}async main(){for(;;)try{this.updator=await this.sleep();try{console.time("update"),await this.updator.exec(),console.timeEnd("update")}finally{this.updator=null}}catch(e){console.error(e);break}}asyncProc(t,o,s){const n=this.updator??new l;n.enqueueAsyncProc(new e(t,o,s)),this.updator||this.wakeup(n)}notify(e,t,o){const n=this.updator??new l;n.enqueueNotify(new s(e,t,o)),this.updator||this.wakeup(n)}updateNode(e,t,o){const s=this.updator??new l;s.enqueueUpdateNode(new c(e,t,o)),this.updator||this.wakeup(s)}static queue=[new d];static get current(){return this.queue.at(-1)}static suspend(e){this.queue.push(new d(e))}static resume(){this.queue.pop().stop()}}const h=Symbol.for("getValue"),u=Symbol.for("setValue");class m{prop;indexes;path;regexp;level;constructor(e,t,o,s=!1){this.prop=e,this.indexes=t?.slice(0)??[],this.path=o,this.isExpandable=s,this.regexp=s?new RegExp("^"+this.prop.replaceAll("*","(\\w+)").replaceAll(".","\\.")+"$"):null,this.level=this.prop.match(/\*/g)?.length??0,this.propIndexes=this.indexes.slice(-this.level)??[]}static getValue(e,t){return e[h](t.prop,t.indexes,t.path)}static setValue(e,t,o){return e[u](t.prop,t.indexes,t.path,o),!0}static cache=new Map;static expandableProperties=[];static create(e,t=null){const s=t?o.getPath(e,t):e,n=e===s&&e.includes("*"),i=new m(e,t,s,n);return n&&this.expandableProperties.push(i),i}}const f=class{static cache=new Map;static trim=e=>e.trim();static has=e=>e.length>0;static parseFilter=e=>{const[t,...o]=e.split(",").map(this.trim);return Object.assign(new class{name;options},{name:t,options:o})};static parseViewModelProp=e=>{const[t,...o]=e.split("|").map(this.trim);return[t,o.map((e=>this.parseFilter(e)))]};static parseBind=(e,t)=>{const[o,s]=[t].concat(...e.split(":").map(this.trim)).splice(-2),[n,i]=this.parseViewModelProp(s);return[o,n,i]};static parseBinds=(e,t)=>{const o=`${e}\t${t}`;if(this.cache.has(o))return this.cache.get(o);{const s=e.split(";").map(this.trim).filter(this.has).map((e=>this.parseBind(e,"$"))).map((([e,o,s])=>(o="@"===o?e:o,[e="$"===e?t:e,o,s])));return this.cache.set(o,s),s}}};class y{static localeString=(e,t)=>null!=e?Number(e).toLocaleString():"";static fixed=(e,t)=>e?.toFixed(t[0]??0)??"";static styleDisplay=(e,t)=>e?t[0]??"":"none";static truthy=(e,t)=>!!e;static falsey=(e,t)=>!e;static not=this.falsey;static upperCase=(e,t)=>e?.toUpperCase()??"";static lowerCase=(e,t)=>e?.toLowerCase()??"";static eq=(e,t)=>e==t[0];static ne=(e,t)=>e!=t[0];static lt=(e,t)=>Number(e)<Number(t[0]);static le=(e,t)=>Number(e)<=Number(t[0]);static gt=(e,t)=>Number(e)>Number(t[0]);static ge=(e,t)=>Number(e)>=Number(t[0]);static embed=(e,t)=>decodeURI((t[0]??"").replaceAll("%s",e));static ifText=(e,t)=>e?t[0]??"":t[1]??""}class g{}class w{static applyForInput=(e,t)=>t.reduceRight(((e,t)=>t.name in g?g[t.name](e,t.options):e),e);static applyForOutput=(e,t)=>t.reduce(((e,t)=>t.name in y?y[t.name](e,t.options):e),e)}class P extends FileReader{constructor(){super()}#e(e,t){return new Promise(((o,s)=>{super.addEventListener("load",(({target:e})=>o(e.result))),super.addEventListener("error",(({target:e})=>s(e.error))),super[t](e)}))}readAsArrayBuffer(e){return this.#e(e,"readAsArrayBuffer")}readAsDataURL(e){return this.#e(e,"readAsDataURL")}readAsText(e){return this.#e(e,"readAsText")}}const b=new Set(["INPUT","SELECT","TEXTAREA","OPTION"]),x=new Set(["radio","checkbox"]),v=Symbol.for("addImportProp");class M{nodes=[];value;boundNodes=[];removeNodes(){this.nodes.forEach((e=>e.parentNode.removeChild(e))),this.nodes.splice(0)}update(e,t){this.boundNodes.forEach((o=>o.update(e,t)))}init(){this.boundNodes.forEach((e=>e.init()))}}class N{node;get element(){return o.toElement(this.node)}get template(){return o.toTemplate(this.node)}get component(){return this.node instanceof de?this.node:o.raise(`node ${this.node} is not component`)}get input(){return o.toInput(this.node)}parentComponent;viewModelProxy;loopNode;viewModelIndex;defaultProperty;defaultEvent="click";viewModelPropByProp=new Map;propsByViewModelPath=new Map;pathsByProp=new Map;loopViewModelProp=null;loopChildren=[];viewModelHandlerByEvent=new Map;constructor(e,t,s){this.parentComponent=e,this.node=t,this.loopNode=s,this.viewModelProxy=e?.viewModelProxy??null,this.defaultProperty=(e=>{if(e instanceof HTMLElement){const t=o.toElement(e);return b.has(t.tagName)?x.has(t.type)?"checked":"value":"textContent"}return"textContent"})(t)}#t(){const e=this.template,t=this,o=this.viewModelProxy,s=this.loopViewModelProp,n=this.loopChildren,i=this.parentComponent,r=document.createDocumentFragment(),a=m.getValue(o,s);for(const[o,c]of Object.entries(a)){const a=new M,p=0===s.level?[o]:s.indexes.concat(o),l=document.importNode(e.content,!0),d=E.select(i,l,e,t,p);n.push(a),a.boundNodes.push(...Array.from(d)),a.nodes.push(...Array.from(l.childNodes)),a.value=c,r.appendChild(l)}e.after(r)}#o(){this.loopChildren.forEach((e=>e.removeNodes())),this.loopChildren=[],this.#t();for(const e of this.loopChildren)e.init()}#s(e){const t=e.trim();this.loopViewModelProp=m.create(t,this.viewModelIndexes)}#n(e,t,o,s,n={}){const i=this.viewModelPropByProp,r=this.propsByViewModelPath,a=this.pathsByProp,c=m.create(t,o);i.set(e,{viewModelProp:c,filters:s});const p=r.get(c.path);if(p?p.push(e):r.set(c.path,[e]),!a.has(e)){const t=e.split(".");let[o,s]=[null,null];2===t.length&&"class"===t[0]?[o,s]=[this.#i,this.#r]:"radio"===e?[o,s]=[this.#a,this.#c]:"checkbox"===e?[o,s]=[this.#p,this.#l]:"file"===e?[o,s]=[this.#d,this.#h]:1===t.length?[o,s]=[this.#u,this.#m]:2===t.length?[o,s]=[this.#f,this.#y]:console.error(`unknown property name ${e}`),a.set(e,{updateNodeFunc:o,updateViewModelFunc:s,paths:t})}if(this.node instanceof de){const t=this.component,o=this.viewModelProxy;"dialog"in t.dataset?Object.defineProperty(t.viewModel,e,{get:()=>Reflect.get(n,c.prop),set:e=>Reflect.set(n,c.prop,e)}):o?(t.viewModelProxy[v](e),Object.defineProperty(t.viewModel,e,{get:()=>m.getValue(o,c),set:e=>m.setValue(o,c,e)})):Object.defineProperty(t.viewModel,e,{get:()=>Reflect.get(I,c.prop),set:e=>Reflect.set(I,c.prop,e)})}}#g(e){const t=this.viewModelIndexes,o=this.viewModelHandlerByEvent;f.parseBinds(e??"",this.defaultProperty).forEach((([e,s,n])=>{if(e.startsWith("on")){const n=m.create(s,t);o.set(e,n)}else this.#n(e,s,t,n)}))}#w(e){const t=this.viewModelIndexes;f.parseBinds(e??"",this.defaultProperty).forEach((([e,o,s])=>{this.#n(e,o,t,s)}))}parse(e,t={}){this.viewModelIndexes=e;const o=this.node;if(o instanceof Comment){this.#w(o.textContent.slice(2));const e=document.createTextNode("");o.parentNode.replaceChild(e,o),this.node=e}else{const o=this.element;if(o instanceof HTMLTemplateElement)"bind"in o.dataset&&(this.#s(o.dataset.bind),this.#t());else if("dialog"in o.dataset)for(const o of Object.keys(t)){const s=o;this.#n(o,s,e,[],t)}else"bind"in o.dataset&&this.#g(o.dataset.bind)}}#u(e,t,o,s,n,i){const r=w.applyForOutput(m.getValue(e,t),i);d.current.updateNode(o,[s],(()=>{o[s]=r}))}#f(e,t,o,s,n,i){const r=w.applyForOutput(m.getValue(e,t),i);d.current.updateNode(o,n,(()=>{o[n[0]][n[1]]=r}))}#i(e,t,s,n,i,r){const a=o.toElement(s),c=w.applyForOutput(m.getValue(e,t),r);d.current.updateNode(s,["classList"],(()=>{c?a.classList.add(i[1]):a.classList.remove(i[1])}))}#a(e,t,s,n,i,r){const a=o.toElement(s),c=w.applyForOutput(m.getValue(e,t),r);d.current.updateNode(s,["checked"],(()=>{a.checked=a.value==c}))}#p(e,t,s,n,i,r){const a=o.toElement(s),c=w.applyForOutput(m.getValue(e,t),r);d.current.updateNode(s,["checked"],(()=>{a.checked=!!c.find((e=>e==a.value))}))}#d(e,t,o,s,n,i){}#P(e,t,s,n,i){if(!(this.node instanceof de)){const{paths:r,updateNodeFunc:a}=this.pathsByProp.get(n);return!a&&o.raise(`unknown property ${n}`),Reflect.apply(a,this,[e,t,s,n,r,i])}{const e=this.node;d.current.notify(e,n,[])}}#m(e,t,o,s,n,i){m.setValue(s,n,w.applyForInput(e[t],i))}#y(e,t,o,s,n,i){m.setValue(s,n,w.applyForInput(e[o[0]][o[1]],i))}#r(e,t,o,s,n,i){}#c(e,t,s,n,i,r){const a=o.toElement(e);a.checked&&m.setValue(n,i,w.applyForInput(a.value,r))}#l(e,t,s,n,i,r){const a=o.toElement(e),c=m.getValue(n,i),p=w.applyForInput(a.value,r);if(a.checked)c.push(p);else{const e=c.findIndex((e=>e==p));e>=0&&c.splice(e,1)}}async#h(e,t,s,n,i,r){const a=o.toInput(e);if(0==a.files.length)return;const c=new P,p=await c.readAsText(a.files[0]),l=w.applyForInput(p,r);m.setValue(n,i,l)}#b(e,t,s,n,i){const{paths:r,updateViewModelFunc:a}=this.pathsByProp.get(t);return!a&&o.raise(`unknown property ${t}`),Reflect.apply(a,this,[e,t,r,s,n,i])}init(){const e=this.parentComponent,t=this.node,o=this.viewModelProxy,s=this.viewModelIndexes,n=this.defaultProperty,i=this.pathsByProp;if(t instanceof Text){for(const[e,{viewModelProp:s,filters:n}]of this.viewModelPropByProp.entries())this.#P(o,s,t,e,n);return}const r=this.element;if(!this.viewModelHandlerByEvent.has("input")){const e=i.has("file")?"file":i.has("radio")?"radio":i.has("checkbox")?"checkbox":n,{viewModelProp:s,filters:a}=this.viewModelPropByProp.get(e)??{};null!=s&&r.addEventListener("input",(n=>{n.stopPropagation(),d.current.asyncProc((()=>this.#b(t,e,o,s,a)),this,[])}))}for(const[t,n]of this.viewModelHandlerByEvent.entries()){const i=t.slice(2);r.addEventListener(i,(t=>{t.stopPropagation(),d.current.asyncProc((()=>e.stackIndexes.push(s,(()=>Reflect.apply(o[n.path],o,[t,...s])))),this,[])}))}for(const[e,{viewModelProp:s,filters:n}]of this.viewModelPropByProp.entries())this.#P(o,s,t,e,n);this.loopChildren.forEach((e=>e.init()))}update(e,t){if(null!=this.loopViewModelProp)e.has(this.loopViewModelProp.path)?this.#o():this.loopChildren.forEach((o=>o.update(e,t)));else{const o=this.node,s=this.viewModelProxy;for(const[n,i]of this.propsByViewModelPath.entries())(e.has(n)||t.has(n))&&i.forEach((e=>{const{viewModelProp:t,filters:n}=this.viewModelPropByProp.get(e);this.#P(s,t,o,e,n)}));this.node instanceof de&&this.component.binder.update(e,t)}}static create(e,t,o=null){return new N(e,t,o)}}const C=e=>{const t=[];for(;null!=e.parentNode;)t.unshift(Array.from(e.parentNode.childNodes).indexOf(e)),e=e.parentNode;return t};class E{static listOfRouteIndexesByTemplate=new Map;static select(e,t,o,s=null,n=[]){const i=[],r=t=>{const o=N.create(e,t,s);o.parse(n),i.push(o)};if(this.listOfRouteIndexesByTemplate.has(o))this.listOfRouteIndexesByTemplate.get(o).map((e=>e.reduce(((e,t)=>e.childNodes[t]),t))).forEach((e=>r(e)));else{const e=[],s=[],n=Array.from(t.querySelectorAll("[data-bind]"));n.forEach((e=>{s.push(C(e))}));const i=[],a=e=>e.childNodes.forEach((e=>{e instanceof Comment&&e.textContent.startsWith("@@")&&i.push(e),a(e)}));a(t),i.map((e=>s.push(C(e)))),this.listOfRouteIndexesByTemplate.set(o,s),e.push(...n),e.push(...i),e.forEach((e=>r(e)))}return i}}const S=e=>e.init();class k{boundNodes=[];component;constructor(e){this.component=e}add(e){this.boundNodes.push(e)}bind(e){this.boundNodes.push(...E.select(this.component,e,this.component.template))}init(){this.boundNodes.forEach(S)}update(e,t){this.boundNodes.forEach(((e,t)=>o=>o.update(e,t))(e,t))}async walk(e){const t=async o=>{for(const s of o){await e(s);for(const e of s.loopChildren)await t(e.boundNodes)}};await t(this.boundNodes)}async findNode(e,t){await this.walk((async o=>{const s=Array.from(o.propsByViewModelPath.keys());for(const n of s.filter((t=>e.has(t))))await t(n,o.node)}))}static rootBinder=new k(null)}const I=new Proxy({},new class{set(e,t,o,s){return Reflect.set(e,t,o,s),k.rootBinder.update(new Set([t]),new Set([`$$${t}`])),!0}}),R=(e,t=e.viewModelProxy)=>e=>()=>Reflect.apply(e,t,[]),$=(e,t=e.viewModelProxy)=>e=>o=>Reflect.apply(e,t,[o]),O=class{static build(e,t=e.viewModel){const s=new Map,n=new Set(Object.keys(t).filter((e=>e.startsWith("__")))),i=[],r=(o,i=null)=>{const r=o.split(".");if(r.length>1){const t=r.pop(),n=o.slice(0,-t.length-1);s.set(o,(e=>(t,o)=>({get:()=>((e,t=e.viewModelProxy)=>(o,s)=>()=>{const n=e.stackIndexes.current??[],i="*"===s?n.at(o.match(/\*/g)?.length):s;return t[o]?.[i]??""})(e)(t,o)(),set:s=>((e,t=e.viewModelProxy)=>(o,s)=>n=>{const i=e.stackIndexes.current??[],r="*"===s?i.at(o.match(/\*/g)?.length):s;return t[o][r]=n,!0})(e)(t,o)(s),enumerable:!0,configurable:!0}))(e)(n,t))}else{const r=o;if(r.startsWith("$$"))s.set(o,(e=>({get:()=>(e=>()=>{const t=e.slice(2);return I?.[t]??""})(e)(),set:t=>(e=>t=>{const o=e.slice(2);return I[o]=t,!0})(e)(t),enumerable:!0,configurable:!0}))(r));else{s.set(o,(e=>t=>({get:()=>((e,t=e.viewModelProxy)=>e=>()=>t?.[`__${e}`]??"")(e)(t)(),set:o=>((e,t=e.viewModelProxy)=>e=>o=>(t[`__${e}`]=o,!0))(e)(t)(o),enumerable:!0,configurable:!0}))(e)(r));const a=`__${r}`;n.has(a)||(Object.defineProperty(t,a,(e=>({value:e,writable:!0,enumerable:!0,configurable:!0}))(i)),n.add(a))}}};for(const[e,o]of Object.entries(t))n.has(e)||(o!==Symbol.for("import")?r(e,o):i.push(e));for(const[n,i]of Object.entries(Object.getOwnPropertyDescriptors(Object.getPrototypeOf(t)))){if("constructor"===n)continue;if(o.isFunction(i.value))continue;s.has(n)||r(n);const t=s.get(n);i.get&&(t.get=()=>R(e)(i.get)()),i.set&&(t.set=t=>$(e)(i.set)(t))}Object.keys(t).filter((e=>!n.has(e))).forEach((e=>delete t[e]));for(const[e,o]of s.entries())Object.defineProperty(t,e,o),m.create(e);const a=Object.keys(t),c=a.filter((e=>`${e}.*`in t)),p=new Map;return a.reduce(((e,t)=>{const o=`${t}.`;return e.set(t,new Set(a.filter((e=>e.startsWith(o))))),e}),p),{importProps:i,arrayProps:c,setOfRelativePropsByProp:p}}},V=Symbol.for("getValue"),F=Symbol.for("setValue"),B=Symbol.for("init"),A=Symbol.for("deleteCache"),D=Symbol.for("raw"),L=Symbol.for("isProxy"),T=Symbol.for("onInit"),j=Symbol.for("asyncProc"),q=Symbol.for("notify"),H=Symbol.for("component"),z=Symbol.for("openDialog"),_=Symbol.for("closeDialog"),W=Symbol.for("cancelDialog"),U=Symbol.for("addImportProp"),K=Symbol.for("findNode"),X=Symbol.for("setOfImportProps"),Z=Symbol.for("setOfArrayProps"),G=Symbol.for("setOfRelativePropsByProp"),J=new Set([V,F,B,A,j,q,z,_,W,U,K]),Q=new Set(["$1","$2","$3","$4","$5","$6","$7","$8","$indexes",X,Z,G,H]);class Y extends Map{#x=!1;#v;constructor(e){super(),this.#v=e}has(e){const t=super.has(e);return this.#x&&!o.isSymbol(e)&&console.log(`cache.has(${e}) = ${t}, ${this.#v?.tagName}`),t}get(e){const t=super.get(e);return this.#x&&!o.isSymbol(e)&&console.log(`cache.get(${e}) = ${t}, ${this.#v?.tagName}`),t}delete(e){const t=super.delete(e);return this.#x&&!o.isSymbol(e)&&console.log(`cache.delete(${e}) = ${t}, ${this.#v?.tagName}`),t}set(e,t){if(o.isSymbol(e)||e.includes("*")||e.startsWith("__")||e.startsWith("$$"))return;if(this.#v.viewModelProxy[X].has(e))return;if(o.isFunction(t))return;t=t?.[L]?t[D]:t;const s=super.set(e,t);return this.#x&&!o.isSymbol(e)&&console.log(`cache.set(${e}, ${t}) = ${s}, ${this.#v?.tagName}`),s}deleteRelative(e){this.delete(e);const t=`${e}.`;Array.from(this.keys()).filter((e=>e.startsWith(t))).forEach((e=>this.delete(e)))}}class ee{component;prop;indexes;constructor(e,t){this.component=e,this.prop=t,this.indexes=e.stackIndexes.current?.slice(0)}get(e,t,o){return t===L||(t===D?e:Reflect.get(e,t,o))}set(e,t,o,s){return Reflect.set(e,t,o,s),"length"===t&&d.current.notify(this.component,this.prop,this.indexes??[]),!0}}const te=(e,t,o)=>(o=o?.[L]?o[D]:o)instanceof Array?new Proxy(o,new ee(e,t)):o;class oe{component;cache;importProps=[];setOfImportProps=new Set;arrayProps;setOfArrayProps;setOfRelativePropsByProp;constructor(e,t,o,s){this.component=e,this.#M(...t),this.cache=new Y(e),this.arrayProps=o,this.setOfArrayProps=new Set(o),this.setOfRelativePropsByProp=s}#M(...e){this.importProps.push(...e),e.forEach((e=>this.setOfImportProps.add(e)))}[U](...e){e.pop(),e.pop(),Reflect.apply(this.#M,this,e)}get[X](){return this.setOfImportProps}get[Z](){return this.setOfArrayProps}get[G](){return this.setOfRelativePropsByProp}get[H](){return this.component}[V](e,t,s,n,i){s=s??o.getPath(e,t);const r=this.cache,a=this.component;return r.has(s)?te(a,e,r.get(s)):a.stackIndexes.push(t,(function(){const t=Reflect.get(n,e,i);return r.set(s,t),te(a,e,t)}))}[F](e,t,s,n,i,r){s=s??o.getPath(e,t);const a=this.cache,c=(this.component,this[q]),p=this;this.component.stackIndexes.push(t,(function(){return Reflect.set(i,e,n,r),a.deleteRelative(s),Reflect.apply(c,p,[e,t??[]]),!0}))}[j](...e){const t=e.pop();e.pop(),d.current.asyncProc(e[0],t,e[1]??[])}[q](e,t){e.startsWith("__")||e.startsWith("$$")||d.current.notify(this.component,e,t??[])}async[B](e,t){T in e&&await Reflect.apply(e[T],t,[])}[A](e){const t=this.cache;for(const o of Array.from(e))t.deleteRelative(o)}async[z](...e){e.pop(),e.pop();const[t,o={}]=e,s=this.component;d.suspend(s);const n=he.tagName(t),i=document.createElement("template");i.innerHTML=`<${n} data-dialog></${n}>`;const r=document.importNode(i.content,!0),a=r.querySelector(n);try{return await new Promise((async(e,t)=>{a.setDialogInfo(s,e,t,o),document.body.appendChild(r),await a.initializePromise}))}catch(e){}finally{document.body.removeChild(a),d.resume()}}[_](e){this.component.closeDialog(e)}[W](){this.component.cancelDialog()}[K](e,t){this.component.binder.findNode(e,t)}setOfNames;get(e,t,s){if(J.has(t))return(...o)=>Reflect.apply(this[t],this,[...o,e,s]);if(Q.has(t))return"$indexes"===t?this.component.stackIndexes.current:o.isSymbol(t)?Reflect.get(this,t):this.component.stackIndexes.current[parseInt(t.slice(1))-1];if(this.cache.has(t))return te(this.component,t,this.cache.get(t));if(!(t in e))for(const o of m.expandableProperties){const n=o.regexp.exec(t);if(n){const i=n.slice(1);return this[V](o.prop,i,t,e,s)}}const n=Reflect.get(e,t,s);return this.cache.set(t,n),te(this.component,t,n)}set(e,t,o,s){if(!(t in e))for(const n of m.expandableProperties){const i=n.regexp.exec(t);if(i){const r=i.slice(1);return this[F](n.prop,r,t,o,e,s),!0}}Reflect.set(e,t,o,s),this.cache.deleteRelative(t);const n=this.component.stackIndexes.current;return this[q](t,n),!0}has(e,t,o){return!!J.has(t)||!!Q.has(t)||t in e||Reflect.has(e,t,o)}}const se=Proxy,ne=class{static create(e,t=e.viewModel){const{importProps:o,arrayProps:s,setOfRelativePropsByProp:n}=O.build(e);return new se(t,new oe(e,o,s,n))}};class ie{component;constructor(e){this.component=e}render(e=this.component,t=e.binder,o=e.template,s=e.shadowRoot){const n=document.importNode(o.content,!0);t.bind(n),t.init(),s.appendChild(n)}}class re extends ie{get css(){return"\n.bg {\n  position: fixed;\n  display: flex;\n  align-items: center;\n  justify-content: space-around;\n  background-color: rgba(0, 0, 0, 0.5);\n  left: 0;\n  top: 0;\n  height: 100vh;\n  width: 100vw;\n  z-index: fixed;\n  position: fixed;\n  position: 499;\n}\n.fg {\n  background-color: white;\n  border-radius: .375rem;\n  padding: 3rem;\n}\n    "}render(e=this.component,t=e.binder,o=e.template,s=e.shadowRoot){const n=document.importNode(o.content,!0);t.bind(n),t.init();const i=document.createElement("style");i.innerHTML=this.css,s.appendChild(i);const r=document.createElement("div");r.classList.add("bg");const a=document.createElement("div");a.classList.add("fg"),r.appendChild(a),a.appendChild(n),s.appendChild(r),r.addEventListener("click",(()=>e.cancelDialog())),a.addEventListener("click",(e=>e.stopPropagation()))}}class ae{stack=[];push(e,t){let o;this.stack.push(e);try{o=t()}finally{this.stack.pop()}return o}get current(){return this.stack.at(-1)}}const ce=Symbol.for("init");class pe extends HTMLElement{#N;#C;#E;#S;#k;#I;#R;#$;template;viewModel;viewModelProxy;view;binder;stackIndexes;constructor(){super(),this.#C=new Promise(((e,t)=>{this.#E=e,this.#S=t}))}createView(){return"dialog"in this.dataset?new re(this):new ie(this)}build(e){this.attachShadow({mode:"open"}),this.template=e.template,this.viewModel=Reflect.construct(e.ViewModel,[]),this.viewModelProxy=ne.create(this),this.view=this.createView(),this.binder=new k(this),this.stackIndexes=new ae}get parentComponent(){if(void 0===this.#N){let e=this;for(;(e=e.getRootNode()?.host??null,null!=e)&&!(e instanceof pe););this.#N=e}return this.#N}set parentComponent(e){this.#N=e}get initializePromise(){return this.#C}setDialogInfo(e,t,o,s){this.#R=e,this.#k=t,this.#I=o,this.#$=s}get resolveForDialog(){return this.#k}get rejectForDialog(){return this.#I}get paramsForDialog(){return this.#$}get componentForDialog(){return this.#R}closeDialog(e){this.resolveForDialog(e)}cancelDialog(){this.rejectForDialog()}async dialogComponentInit(){d.current.asyncProc((async()=>{const e=N.create(this.componentForDialog,this);e.parse([],this.paramsForDialog),await this.viewModelProxy[ce](),e.init(),this.view.render()}),this,[])}async topComponentInit(){d.current.asyncProc((async()=>{const e=N.create(null,this);e.parse([]),await this.viewModelProxy[ce](),e.init(),k.rootBinder.add(e),this.view.render()}),this,[])}async defaultComponentInit(){d.current.asyncProc((async()=>{await this.parentComponent.initializePromise,await this.viewModelProxy[ce](),this.view.render()}),this,[])}async componentInit(){"dialog"in this.dataset?await this.dialogComponentInit():null==this.parentComponent?await this.topComponentInit():await this.defaultComponentInit(),this.#E(!0)}async connectedCallback(){await this.componentInit()}disconnectedCallback(){}adoptedCallback(){}attributeChangedCallback(e,t,o){}}class le extends Map{set(e,t){super.set(e.toUpperCase(),t),customElements.define(e,class extends de{})}}class de extends pe{constructor(){super(),super.build(he.getComponentDataByTagName(this.tagName))}}class he{static#O;static get prefix(){return this.#O}static set prefix(e){this.#O=e}static tagName(e){return this.#O?`${this.#O}-${e}`:e}static#V=new le;static getComponentDataByTagName(e){return this.#V.get(e)}static registComponentData(e,t){this.#V.set(o.toKebabCase(e),t)}}class ue{html;css;template;ViewModel;static create(e){const t=Object.assign(new ue,e);return t.template=t.template??this.createTemplate(this.mergeHtml(t.html,t.css)),t}static mergeHtml(e,t){return(t?`<style>${t}</style>`:"")+((e=e.replaceAll(/\{([^\}]+)\}/g,((e,t)=>`\x3c!--@@${t}--\x3e`)))??"")}static createTemplate(e){const t=document.createElement("template");return t.innerHTML=e,t}}window.redatax=class{static prefix=e=>(he.prefix=e,this);static components=e=>{for(const[t,o]of Object.entries(e)){const e=ue.create(o);he.registComponentData(he.tagName(t),e)}return this};static globals=e=>(Object.assign(I,e),this)}})();