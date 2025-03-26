
// 添加 worker blob URL 创建函数
export function createWorkerBlobURL() {
    const workerCode = `
        // 内联 createChunk 的实现
        function simpleHash(str) {
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash;
            }
            return Math.abs(hash).toString(16);
        }

        async function createChunk(file, index, size) {
            return new Promise(async (resolve, reject) => {
                const start = index * size;
                const end = start + size;
                const chunk = file.slice(start, end);
                
                if (index === 0) {
                    try {
                        // 动态导入 SparkMD5
                        const reader = new FileReader();
                        reader.onload = async function(e) {
                            try {
                                // 注意：这里我们直接使用 importScripts 加载 SparkMD5
                                importScripts('https://cdn.jsdelivr.net/npm/spark-md5@3.0.2/spark-md5.min.js');
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
                            } catch (err) {
                                console.warn('Failed to load SparkMD5, falling back to simple hash:', err);
                                const simpleHashStr = simpleHash(\`\${file.name}-\${index}-\${start}\`);
                                resolve({
                                    file: chunk,
                                    start: start,
                                    end: end,
                                    hash: simpleHashStr,
                                    type: file.type,
                                    name: file.name
                                });
                            }
                        };
                        reader.readAsArrayBuffer(chunk);
                    } catch (error) {
                        const simpleHashStr = simpleHash(\`\${file.name}-\${index}-\${start}\`);
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
                    const simpleHashStr = simpleHash(\`\${file.name}-\${index}-\${start}\`);
                
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

        self.onmessage = async function (e) {
            try {
                const { file, CHUNK_SIZE, start, end } = e.data;
                const proms = [];
                for (let i = start; i < end; i++) {
                    proms.push(createChunk(file, i, CHUNK_SIZE));
                }
                const chunks = await Promise.all(proms);
                self.postMessage(chunks);
            } catch (error) {
                self.postMessage({ error: error.message });
            }
        }
    `;
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    return URL.createObjectURL(blob);
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

export interface createChunkBlobType {
    file: Blob;
    start: number;
    end: number;
    hash: string;
    type: string;
    name: string;
}

export interface createChunkType extends createChunkBlobType {}
