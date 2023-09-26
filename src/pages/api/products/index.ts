import { ProductModel } from "@/database";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse){
    if(req.method === 'POST'){
        req.body.note = JSON.stringify(req.body.note)
        const Product = await ProductModel.create(req.body)
        res.status(200).json({
            message: "Tạo sản phẩm thành công!",
            success: true,
            data: Product
        })
    }
    res.status(200).json({message: "Hello World!"})
}
