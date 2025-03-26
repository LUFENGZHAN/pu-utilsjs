export const formatNumber  = (month: string | number): String => String(month).padStart(2, '0')
export const isNumericString   =(str:string):boolean =>/^\d+$/.test(str)
export default {
    formatNumber,
    isNumericString  
}