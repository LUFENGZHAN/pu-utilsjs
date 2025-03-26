import { formatNumber, isNumericString } from './tool';
import CryptoJs from 'crypto-js';
import { createChunkType as ChunkType, createChunkBlob,createWorkerBlobURL, createChunkBlobType as ChunkBlobType } from './createChunk';
export type createChunkType = ChunkType;
export type createChunkBlobType = ChunkBlobType;

/**
 * 计算两个字符串表示的数字之和
 * @param {string} start 第一个数字
 * @param {string} end 第二个数字
 * @returns {string} - 两个数字之和
 */
export const MaxNum = (start: string, end: string): String => {
	if (!start || !end || typeof start !== 'string' || typeof end !== 'string') {
		throw new Error('Invalid input: Both parameters must be non-empty strings');
	}
	if (!isNumericString(start) || !isNumericString(end)) {
		throw new Error('Must be a numeric string');
	}
	const len = Math.max(start.length, end.length);
	start = start.padStart(len, '0');
	end = end.padStart(len, '0');
	let carry = 0;
	let result = '';
	for (let i = len - 1; i >= 0; i--) {
		const sum = +start[i] + +end[i] + carry;
		result = (sum % 10) + result;
		carry = Math.floor(sum / 10);
		if (sum > 9) {
			carry = 1;
		} else {
			carry = 0;
		}
	}
	return result;
};

/**
 * 获取日期范围，可以获取最近N个月的起止日期
 * @param {number} interval 间隔月数，必须大于0
 * @param {boolean} fromToday 是否从当天开始计算（否则从月初/月末计算）
 * @returns {Array<string>} - 包含起始日期和结束日期的数组，格式：YYYY-MM-DD
 * @throws {Error} 当 interval 小于或等于0时抛出错误
 */
export const getDateRange = (interval: number = 1, fromToday: boolean = false): Array<string> => {
    // 验证 interval 参数
    const validInterval = Number(interval);
    if (isNaN(validInterval) || validInterval <= 0) {
        throw new Error('interval must be a positive number');
    }

    const date = new Date();
    const currentYear = date.getFullYear();
    const currentMonth = date.getMonth(); // 0-11
    const currentDay = date.getDate();

    // 计算起始日期的年月
    let startMonth = currentMonth - (validInterval - (fromToday ? 0 : 1));
    let startYear = currentYear;
    
    // 处理月份小于0的情况
    if (startMonth < 0) {
        const yearDiff = Math.floor(Math.abs(startMonth) / 12) + 1;
        startYear -= yearDiff;
        startMonth = 12 + (startMonth % 12);
        if (startMonth === 12) {
            startMonth = 0;
            startYear += 1;
        }
    }

    // 计算每个月的天数
    const startMonthDays = new Date(startYear, startMonth + 1, 0).getDate();
    const endMonthDays = new Date(currentYear, currentMonth + 1, 0).getDate();

    // 确定日期
    const startDay = fromToday ? Math.min(currentDay, startMonthDays) : 1;
    const endDay = fromToday ? currentDay : endMonthDays;

    // 格式化日期字符串
    const start = `${startYear}-${formatNumber(startMonth + 1)}-${formatNumber(startDay)}`;
    const end = `${currentYear}-${formatNumber(currentMonth + 1)}-${formatNumber(endDay)}`;

    return [start, end];
};

// 为了保持向后兼容，保留旧的函数名作为别名
export const defTime = getDateRange;

/**
 * 文件分片
 * @param {File} file 文件
 * @param {number} size 切片大小
 * @param {Boolean} hash 是否使用hash
 */
export const cuFile = (file: File, size: number = 5, hash: Boolean = false) => {
    return new Promise((resolve, reject) => {
        const workers: Worker[] = [];
        let workerURL: string | null = null;

        // 清理函数
        const cleanup = () => {
            // 终止所有 worker
            workers.forEach(worker => worker.terminate());
            workers.length = 0;
            // 清理 blob URL
            if (workerURL) {
                URL.revokeObjectURL(workerURL);
                workerURL = null;
            }
        };

        try {
            if (!file) return [];
            const CHUNK_SIZE = Math.round(size) * 1024 * 1024;
            const chunkCount = Math.ceil(file.size / CHUNK_SIZE);
            const THREAD_COUNT = navigator.hardwareConcurrency || 4;
            const threadChunkCount = Math.ceil(chunkCount / THREAD_COUNT);
            let finishCount = 0;
            const result: ChunkBlobType[] = [];
            if (!hash) {
                return resolve(createChunkBlob(file, CHUNK_SIZE));
            }

            workerURL = createWorkerBlobURL();
            
            for (let i = 0; i < THREAD_COUNT; i++) {
                const worker = new Worker(workerURL, { type: 'module' });
                workers.push(worker); // 将 worker 添加到数组中

                let end = (i + 1) * threadChunkCount;
                let start = i * threadChunkCount;
                if (end > chunkCount) {
                    end = chunkCount;
                }
                
                worker.onerror = (error) => {
                    console.error('Worker error:', error);
                    cleanup();
                    reject(error);
                };
                
                worker.onmessage = e => {
                    if (e.data.error) {
                        console.error('Worker reported error:', e.data.error);
                        cleanup();
                        reject(new Error(e.data.error));
                        return;
                    }
                    
                    for (let i = start; i < end; i++) {
                        result[i] = e.data[i - start];
                    }
                    worker.terminate();
                    finishCount++;
                    if (finishCount === THREAD_COUNT) {
                        cleanup();
                        resolve(result);
                    }
                };
                
                worker.postMessage({
                    file,
                    CHUNK_SIZE,
                    start: start,
                    end: end,
                });
            }
        } catch (error) {
            cleanup();
            reject(error);
        }
    });
};

/**
 * crypto-js加密
 * @param {*} value 内容
 * @param {string}key key值
 * @param {boolean}md5 是否把您传入的key值转为MD5
 * @returns {encryptType} 包含key值和密文的对象
 */
export const encrypt = (value: any, key?: string, md5?: boolean): encryptType => {
	const keyStr = md5 && key ? CryptoJs.MD5(key).toString() : key ? key : CryptoJs.MD5(value).toString();
	const encrypts = CryptoJs.AES.encrypt(JSON.stringify(value), keyStr);
	return {
		value: encrypts.toString(),
		key: keyStr,
	};
};

/**
 * crypto-js解密
 * @param {*} value 内容
 * @param {string}key key值
 */
export const decrypt = (value: any, key: string) => {
	let decrypts = CryptoJs.AES.decrypt(value, key).toString(CryptoJs.enc.Utf8);
	return (decrypts && JSON.parse(decrypts)) || null;
};

/**
 * 文件下载函数
 * @param {Blob} data - 文件数据
 * @param {string} filename - 下载文件的名称
 * @param {string} fileType - 文件类型，如 'pdf', 'word', 'excel', 'ppt'
 */
type FileType = 'pdf' | 'doc' | 'docx' | 'xls' | 'xlsx' | 'ppt' | 'pptx' | 'zip';
const mimeTypes: Record<FileType, string> = {
	pdf: 'application/pdf',
	doc: 'application/msword',
	docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	xls: 'application/vnd.ms-excel',
	xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	ppt: 'application/vnd.ms-powerpoint',
	pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
	zip: 'application/zip',
};
export const downloadFile = (data: Blob, fileType: FileType, filename?: string, is_blob: boolean = true) => {
	if (!(data instanceof Blob) && is_blob) {
		throw new Error('Invalid input: data must be a Blob');
	}
	const type = mimeTypes[fileType] || fileType;
	try {
		const blob = new Blob([data], { type });
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = filename || '文件';
		a.click();
		window.URL.revokeObjectURL(url);
		return url;
	} catch (error) {
		console.error('Error creating or downloading the file:', error);
		return '';
	}
};

/**
 * 防抖函数
 * @param {Function} func 需要防抖的函数
 * @param {number} wait 延迟执行的时间
 * @returns  防抖后的函数
 */
export const debounce = (func: Function, wait: number): ((...args: any[]) => void) => {
	let timeout: any = null;
	return function (...args: any[]): void {
		clearTimeout(timeout);
		timeout = setTimeout(() => {
			timeout = null;
			func.apply(this, args);
		}, wait);
	};
};

export default {
	MaxNum,
	getDateRange,
	cuFile,
	encrypt,
	decrypt,
	downloadFile,
	debounce,
};

interface encryptType {
	value: string;
	key: string;
}
