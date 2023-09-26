import IProduct from "./product"
import IUser from "./user"

export default interface IAssemblyLine {
    id: string | number
    name: string
    productId: number | string
    managerId: string | number
    finish: number | string
    shift: "MS" | "NS" | "AS" | "ALL"
    createdAt: string
    startAt: string
    endAt: string
    status: "PENDING" | "OFF" | "CANCELED" | "ON" | "ARCHIVED",
    workers?: IUser[]
    note?: string[]
    product?: IProduct
    workerId?: (string | number)[]
}