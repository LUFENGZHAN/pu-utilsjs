// 简单哈希函数
function simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
}

export const createChunkBlob = (file: File, size: number):createChunkBlobType[] => {
    const chunks = [];
    let offset = 0;
    while (offset < file.size) {
        chunks.push({
            file: file.slice(offset, offset + size),
            start: offset,
            end: offset + size,
            hash:`${file.name}-${offset}`,
            type:file.type,
            name:file.name
        });
        offset += size;
    }
    return chunks;
}

export const createChunk = (file: File, index: number, size:number):Promise<createChunkType>=> {
    return new Promise(async (resolve, reject) =>{
        const start = index * size;
        const end = start + size;
        const chunk = file.slice(start, end);
        
        // 对第一个块使用 MD5，其他块使用简单哈希
        if (index === 0) {
            try {
                // 动态导入 spark-md5
                const SparkMD5 = (await import('spark-md5')).default;
                const reader = new FileReader();
                reader.onload = function(e:any) {
                    const spark = new SparkMD5.ArrayBuffer();
                    spark.append(e.target.result);
                    const md5 = spark.end();
                    resolve({
                        file: chunk,
                        start: start,
                        end: end,
                        hash: md5,
                        type: file.type,
                        name: file.name
                    });
                }
                reader.readAsArrayBuffer(chunk);
            } catch (error) {
                // 如果动态导入失败，降级使用简单哈希
                console.warn('Failed to load SparkMD5, falling back to simple hash:', error);
                const simpleHashStr = simpleHash(`${file.name}-${index}-${start}`);
                resolve({
                    file: chunk,
                    start: start,
                    end: end,
                    hash: simpleHashStr,
                    type: file.type,
                    name: file.name
                });
            }
        } else {
            // 其他块使用简单哈希
            const simpleHashStr = simpleHash(`${file.name}-${index}-${start}`);
            resolve({
                file: chunk,
                start: start,
                end: end,
                hash: simpleHashStr,
                type: file.type,
                name: file.name
            });
        }
    });
}

export interface createChunkBlobType {
    file: Blob;
    start: number;
    end: number;
    hash: string;
    type: string;
    name: string;
}

export interface createChunkType extends createChunkBlobType {}
