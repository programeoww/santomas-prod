import { AssemblyLineModel } from "@/database";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse){
    if(req.method === 'POST'){
        try {
            const AssemblyLine = await AssemblyLineModel.create(req.body)
            res.status(200).json({
                message: "Tạo dây chuyền thành công!",
                success: true,
                data: AssemblyLine
            })
        } catch (error) {
            res.status(200).json({
                message: "Tạo dây chuyền thất bại!",
                success: false,
                data: error
            })
        }
    } else if(req.method === 'GET'){
        try{
            const AssemblyLine = await AssemblyLineModel.findAll({
                include: [
                    {
                        association: 'manager'
                    },
                    {
                        association: 'workers'
                    },
                    {
                        association: 'product'
                    }
                ]
            })

            res.status(200).json({
                message: "Lấy dây chuyền thành công!",
                success: true,
                data: AssemblyLine
            })
        } catch (error) {
            res.status(200).json({
                message: "Lấy dây chuyền thất bại!",
                success: false,
                data: error
            })
        }
    }
    res.status(200).json({message: "Hello World!"})
}
