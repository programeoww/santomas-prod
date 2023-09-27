import IAssemblyLine from "../interfaces/assemblyLines";
import { useState, useEffect } from "react";
import IUser from "../interfaces/user";
import IProduct from "../interfaces/product";
import { CircularProgressbar } from "react-circular-progressbar";
import moment from "moment";
import getFinishPercent from "../utils/getFinishPercent";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import instance from "@/instance";
import { getSession } from "next-auth/react";
import { GetServerSidePropsContext } from "next";
import 'react-circular-progressbar/dist/styles.css';

const Select = dynamic(() => import('react-select'), { ssr: false });

type IAssemblyLineWithRelationship = IAssemblyLine & {
    product: IProduct;
    user: IUser;
    workerId: number[];
}

export const getServerSideProps = async (context: GetServerSidePropsContext) => {
    const session = await getSession(context)
    if(!session) {
        return {
            redirect: {
                destination: '/login',
                permanent: false
            }
        }
    }

    if(session.user.role !== "admin" && session.user.role !== "tivi") {
        return {
            redirect: {
                destination: '/404',
                permanent: false,
            }
        }
      }
  
    return {
        props: {
        }
    }
  }

function PageInspection() {
    const router = useRouter();
    const { assembly_line } = router.query
    const [currentAssemblyLine, setCurrentAssemblyLine] = useState<IAssemblyLineWithRelationship>();
    const [assemblyLines, setAssemblyLines] = useState<IAssemblyLineWithRelationship[]>([]);
    const [currentTime, setCurrentTime] = useState<string>();

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(moment().format("HH:mm:ss DD-MM-YYYY"));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        (async () => {
            const { data: { data: assemblyLinesData } } = await instance.get(`/assembly-line`);
            setAssemblyLines(assemblyLinesData);
            if(assembly_line) {
                setCurrentAssemblyLine(assemblyLinesData.find((assemblyLine: IAssemblyLineWithRelationship) => assemblyLine.id === Number(assembly_line)));
            }else{
                setCurrentAssemblyLine(assemblyLinesData[0]);
            }
        })();
    }, [assembly_line]);

    useEffect(() => {
        const interval = setInterval(async () => {
            if(currentAssemblyLine) {
                const { data: { data: assemblyLineData } } = await instance.get(`/assembly-line/${currentAssemblyLine.id}`);
                setCurrentAssemblyLine(assemblyLineData);
            }
        }, 3000);
        return () => clearInterval(interval);
    }, [currentAssemblyLine]);

    return currentTime && currentAssemblyLine &&(
        <div className="shadow-lg p-8 border max-w-7xl mx-auto">
            <h1 className="text-center text-4xl font-bold mb-12">Bảng hiện thị số lượng sản phẩm lắp ráp</h1>
            <div className="flex flex-wrap -m-5 items-stretch">
                <div className="p-5 w-1/3">
                    <Select
                        styles={{
                            control: (provided) => ({
                                ...provided,
                                minHeight: 50,
                            }),
                        }}
                        defaultValue={currentAssemblyLine}
                        placeholder="Chọn dây chuyền"
                        noOptionsMessage={() => "Không có dây chuyền nào"}
                        options={ assemblyLines }
                        getOptionValue={(option) => (option as IAssemblyLineWithRelationship).id.toString()}
                        getOptionLabel={(option) => (option as IAssemblyLineWithRelationship).name}
                        value={assemblyLines.find(assemblyLine => assemblyLine.id === currentAssemblyLine.id)}
                        onChange={(newValue) => setCurrentAssemblyLine(newValue as IAssemblyLineWithRelationship)}
                    />
                </div>
                <div className="p-5 w-1/3">
                    <div className="flex items-center border border-neutral-300 rounded p-2 px-4 space-x-3">
                        <p className="text-xl text-center leading-8">Sản phẩm:</p>
                        <p className="text-2xl font-medium text-center">{currentAssemblyLine.product?.name}</p>
                    </div>
                </div>
                <div className="p-5 w-1/3">
                    <div className="flex items-center border border-neutral-300 rounded p-2 px-4 space-x-3">
                        <p className="text-xl text-center leading-8">Shift:</p>
                        <p className="text-2xl font-medium text-center">{currentAssemblyLine.shift}</p>
                    </div>
                </div>
                <div className="w-full p-5">
                    <div className="p-2 rounded px-4 border border-neutral-300">
                        <p className="text-xl mb-2 font-medium">Note</p>
                        <p className="text-lg">{currentAssemblyLine.note?.join(", ")}</p>
                    </div>
                </div>
                <div className="p-5 w-2/3">
                    <div className="flex items-center rounded p-2 space-x-10">
                        <p className="text-xl leading-8 w-1/2">Mục tiêu sản lượng:</p>
                        <p className="text-2xl text-center py-2 border border-neutral-300 rounded font-medium w-1/2">{currentAssemblyLine.product?.target}</p>
                    </div>
                    <div className="flex items-center rounded p-2 space-x-10">
                        <p className="text-xl leading-8 w-1/2">Số lượng hiện tại:</p>
                        <p className="text-2xl text-center py-2 border border-neutral-300 rounded font-medium w-1/2">{currentAssemblyLine.status === "OFF" ? 0 : currentAssemblyLine.finish}</p>
                    </div>
                    <div className="flex items-center rounded p-2 space-x-10">
                        <p className="text-xl leading-8 w-1/2">Tỷ lệ hoàn thành</p>
                        <p className="text-2xl text-center py-2 border border-neutral-300 rounded font-medium w-1/2">{currentAssemblyLine.status === "OFF" ? 0 : getFinishPercent(currentAssemblyLine.finish, currentAssemblyLine.product?.target)}%</p>
                    </div>
                    <div className="flex items-center rounded p-2 space-x-10">
                        <p className="text-xl leading-8 w-1/2">Số lượng còn thiếu:</p>
                        <p className="text-2xl text-center py-2 border border-neutral-300 rounded font-medium w-1/2">{currentAssemblyLine.status === "OFF" ? currentAssemblyLine.product?.target : Number(currentAssemblyLine.product?.target) - Number(currentAssemblyLine.finish) < 0 ? 0 : Number(currentAssemblyLine.product?.target) - Number(currentAssemblyLine.finish) || 0}</p>
                    </div>
                </div>
                <div className="p-5 w-1/4 mx-auto">
                    <CircularProgressbar styles={{path:{stroke: `rgb(59, 130, 246)`}, text: {fill: 'rgb(59, 130, 246)'},}} className="duration-150" value={currentAssemblyLine.status === "OFF" ? 0 : Number(currentAssemblyLine.finish) * 100 / Number(currentAssemblyLine.product?.target)} text={`${currentAssemblyLine.status === "OFF" ? 0 : getFinishPercent(currentAssemblyLine.finish, currentAssemblyLine.product?.target)}%`} />
                </div>
                <div className="p-5 w-1/2 border-t-2">
                    <div className="flex items-center rounded p-2">
                        <p className="text-xl leading-8 w-1/2">Thời gian bắt đầu:</p>
                        <p className="text-2xl text-center py-2 px-3 border border-neutral-300 rounded font-medium w-1/2">{moment(currentAssemblyLine.status === "OFF" ? undefined : currentAssemblyLine.createdAt).format("HH:mm:ss DD-MM-YYYY")}</p>
                    </div>
                </div>
                <div className="p-5 w-1/2 border-t-2">
                    <div className="flex items-center rounded p-2">
                        <p className="text-xl leading-8 w-1/2">Thời gian hiện tại:</p>
                        <p className="text-2xl text-center py-2 px-3 border border-neutral-300 rounded font-medium w-1/2">{currentTime}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PageInspection;