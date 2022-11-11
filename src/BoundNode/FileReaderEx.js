export default class FileReaderEx extends FileReader{
  constructor(){
    super();
  }

  #readAs(blob, ctx){
    return new Promise((resolve, reject)=>{
      super.addEventListener("load", ({target}) => resolve(target.result));
      super.addEventListener("error", ({target}) => reject(target.error));
      super[ctx](blob);
    });
  }

  readAsArrayBuffer(blob){
    return this.#readAs(blob, "readAsArrayBuffer");
  }

  readAsDataURL(blob){
    return this.#readAs(blob, "readAsDataURL");
  }

  readAsText(blob){
    return this.#readAs(blob, "readAsText");
  }
  
}