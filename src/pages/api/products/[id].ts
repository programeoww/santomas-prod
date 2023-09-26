import { NextApiRequest, NextApiResponse } from "next";
import { ProductModel } from "@/database";

export default async function handler(req: NextApiRequest, res: NextApiResponse){
    if(req.method === 'PUT'){
        req.body.note = JSON.stringify(req.body.note)
        const Product = await ProductModel.update(req.body, {
            where: {
                id: req.query.id
            }
        })

        res.status(200).json({
            message: "Cập nhật sản phẩm thành công!",
            success: true,
            data: Product
        })
    } else if(req.method === 'DELETE'){
        await ProductModel.destroy({
            where: {
                id: req.query.id
            }
        })

        res.status(200).json({
            message: "Xóa sản phẩm thành công!",
            success: true,
        })
    }
    res.status(200).json({message: "Hello World!"})
}