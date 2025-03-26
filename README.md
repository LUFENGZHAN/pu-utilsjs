# pu-utilsjs

> 记录平时常用小工具集合

### Initial

```js
npm install pu-utilsjs
```

###### 使用方法

```js
import utilsjs from 'pu-utilsjs';
```

| 函数         | 参数                     | 备注                                                                                                                        |
| ------------ | ------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| debounce     | debounce(函数,1000)      | 返回防抖函数函数，单位为毫秒                                                                                                |
| getDateRange | getDateRange(1,false)    | 返回当前月份往前推的时间区间,true 为当前的时间前推，false 是当前月份往前推                                                  |
| cuFile       | cuFile(文件,5,false)     | 文件分切处理，布尔值用于绝对是否使用 MD5 作为 hash 值                                                                       |
| encrypt      | encrypt(内容,key,true)   | 加密默认采用 MD5 作为 key，第三个参入为真的话是把您传入的 key 转为 MD5，函数返回对象                                        |
| decrypt      | decrypt(密文,key)        | 返回解密结果，key 必须与加密时的 key 一样                                                                                   |
| MaxNum       | MaxNum(数字 1,数字 2)    | 返回两数之和                                                                                                                |
| downloadFile | downloadFile(Blob,'pdf') | 文档流下载,第二入参如:pdf,doc,xls,ppt,zip,也可传入其他的类型如:text/plain、application/x-tar,第四个入参是否检验第一入参类型 |


#### 数字最大之和

```js
import { MaxNum } from 'pu-utilsjs';

MaxNum('12345678987654321', '12345678987654321'); //24691357975308642
```

#### 获取时间区间

```js
import { getDateRange } from 'pu-utilsjs';

getDateRange(1); //['2024-03-01', '2024-03-31']
getDateRange(1, true); //['2024-02-18', '2024-03-18']
```

#### 文件切片

```js
import { cuFile } from 'pu-utilsjs';

cuFile(File);
```

#### 内容加密

```js
import  {encrypt,decrypt} from "pu-utilsjs"

encrypt(value,'123456'){
    return {key:string,value:string}
}  //加密
decrypt(value,'123456'):string  //解密
```

#### 文档流文件下载

```js
import { downloadFile } from 'pu-utilsjs';

// 'pdf' | 'doc' | 'docx' | 'xls' | 'xlsx' | 'ppt' | 'pptx' | 'zip'
downloadFile(Blob, 'doc', 'word文件');
```

#### 防抖函数

```js
//<span @click="init(1,2,3)">点击</span>
import { debounce } from 'pu-utilsjs';
const init = debounce((a, b, c) => {
	console.log(a, b, c);
}, 1000);
```
