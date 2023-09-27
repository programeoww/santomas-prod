import { NextApiRequest, NextApiResponse } from "next";
import { AssemblyLineModel, ProductModel } from "@/database";

export default async function handler(req, res){
    if(req.method === 'PUT'){
        req.body.note = JSON.stringify(req.body.note)

        const AssemblyLine = await AssemblyLineModel.update(req.body, {
            where: {
                id: req.query.id
            }
        })

        if(req.body.workerId && req.body.workerId.length > 0){
            AssemblyLineModel.findByPk(req.query.id).then((AssemblyLine) => {
                AssemblyLine.setWorkers(req.body.workerId)
            })
        }

        res.status(200).json({
            message: "Cập nhật dây chuyền thành công!",
            success: true,
            data: AssemblyLine
        })
    }else if(req.method === 'GET'){
        try{
            const AssemblyLine = await AssemblyLineModel.findOne({
                where: {
                    id: req.query.id
                },
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

            const data = {
                ...AssemblyLine.dataValues,
                note: JSON.parse(AssemblyLine.dataValues.note === "" ? "[]" : AssemblyLine.dataValues.note)
            }

            res.status(200).json({
                message: "Lấy dây chuyền thành công!",
                success: true,
                data: data
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