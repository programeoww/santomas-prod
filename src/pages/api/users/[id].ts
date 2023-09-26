import { NextApiRequest, NextApiResponse } from "next";
import { UserModel } from "@/database";
import bcrypt from 'bcryptjs'

export default async function handler(req: NextApiRequest, res: NextApiResponse){
    if(req.method === 'PUT'){
        try {
            if(req.body.password){
                req.body.password = await bcrypt.hash(req.body.password, 10)
            }
            
            const User = await UserModel.update(req.body, {
                where: {
                    id: req.query.id
                }
            })
    
            res.status(200).json({
                message: "Cập nhật người dùng thành công!",
                success: true,
                data: User
            })
        } catch (error) {
            res.status(200).json({
                message: "Cập nhật người dùng thất bại!",
                success: false,
                data: error
            })
        }
    } else if(req.method === 'DELETE'){
        await UserModel.destroy({
            where: {
                id: req.query.id
            }
        })

        res.status(200).json({
            message: "Xóa người dùng thành công!",
            success: true,
        })
    }
    res.status(200).json({message: "Hello World!"})
}