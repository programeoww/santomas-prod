import IProduct from "../../interfaces/product";
import { useMemo } from "react";
import instance from "@/instance";
import IAssemblyLine from "../../interfaces/assemblyLines";
import { Controller, useForm } from "react-hook-form";
import { MultiValue, SingleValue } from 'react-select';
import IUser from "@/interfaces/user";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import { ParsedUrlQuery } from "querystring";
import { GetServerSidePropsContext } from "next";
import { AssemblyLineModel, ProductModel, UserModel } from "@/database";
import { getSession, useSession } from "next-auth/react";
import dynamic from "next/dynamic";

const Select = dynamic(() => import('react-select'), { ssr: false });

interface Params extends ParsedUrlQuery {
    id: string;
}

export const getServerSideProps = async (context: GetServerSidePropsContext) => {
    const { id } = context.params as Params;
    const session = await getSession(context)
    if(!session) {
        return {
            redirect: {
                destination: '/login',
                permanent: false
            }
        }
    }

    if(session.user.role !== "admin") {
        return {
            redirect: {
                destination: '/404',
                permanent: false,
            }
        }
      }

    if(!id) {
        return {
            redirect: {
                destination: '/assembly-line',
                permanent: false
            }
        }
    }

    const assemblyLines = await AssemblyLineModel.findAll({
        where: {
            id: id
        },
        include: [
            {
                model: ProductModel,
                as: "product",
                foreignKey: "productId"
            },
            {
                model: UserModel,
                as: "manager",
                foreignKey: "managerId"
            },
            {
                model: UserModel,
                as: "workers",
                foreignKey: "workerId"
            }
        ]
    })

    const products = await ProductModel.findAll();
    const workers = await UserModel.findAll({
        where: {
            role: "worker"
        }
    })

    return {
        props: { 
            assemblyLinesRaw: JSON.stringify(assemblyLines),
            productsRaw: JSON.stringify(products),
            workersRaw: JSON.stringify(workers)
        }
    }
}

function PageAssemblyLineEdit({ assemblyLinesRaw, productsRaw, workersRaw }: { assemblyLinesRaw: string, productsRaw: string, workersRaw: string }) {
    const router = useRouter();
    const { id } = router.query as Params;
    const currentAssemblyLine = useMemo<IAssemblyLine>(() => JSON.parse(assemblyLinesRaw)[0], [assemblyLinesRaw]);
    const products = useMemo<IProduct[]>(() => JSON.parse(productsRaw || '[]'), [productsRaw]);
    const workers = useMemo<IUser[]>(() => JSON.parse(workersRaw || '[]'), [workersRaw]);
    const shifts = useMemo<IAssemblyLine['shift'][]>(() => [ "MS","NS","AS","ALL" ], []);
    const { register, handleSubmit, formState: { errors }, watch, control, setValue } = useForm<IAssemblyLine>({
        defaultValues: {
            name: currentAssemblyLine.name,
            productId: currentAssemblyLine.productId,
            shift: currentAssemblyLine.shift,
            workerId: currentAssemblyLine.workers?.map(worker => worker.id)
        }
    });
    const session = useSession();

    const onSubmit = async (data: IAssemblyLine) => {
        data.finish = 0;
        data.status = "ON";
        data.managerId = session.data!.user.id;

        await instance.put<IAssemblyLine>(`/assembly-line/${id}`, data);
        toast.success("Cập nhật dây chuyền thành công");
        router.push(`/assembly-line`);
    }

    return (
        <>
            <div className="max-w-3xl mx-auto flex items-center justify-center">
                <div className="bg-white shadow-md border border-gray-200 w-full rounded-lg sm:p-6 lg:p-8">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" action="#">
                        <h3 className="text-4xl font-medium text-gray-900 text-center">Sửa dây chuyền</h3>
                        <div>
                            <label htmlFor="name" className=" font-medium block mb-2">Tên dây chuyền <span className="text-red-500">*</span></label>
                            <input {...register('name', {required: 'Trường này không được để trống'})} placeholder="Dây chuyền 1" className="bg-gray-50 border border-gray-300 sm: rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-blue-500 block w-full p-2.5" />
                            {errors.name && <span className="text-red-500  mt-2">{errors.name.message}</span>}
                        </div>
                        <div>
                            <label htmlFor="product" className=" font-medium block mb-2">Sản phẩm</label>
                            <Controller
                                control={control}
                                name="productId"
                                rules={{ required: 'Trường này không được để trống' }}
                                render={({ field: { onChange, value, name } }) => (
                                    <Select
                                        name={name}
                                        placeholder="Chọn sản phẩm"
                                        noOptionsMessage={() => "Không có sản phẩm nào"}
                                        options={ products }
                                        getOptionValue={(option) => (option as IProduct).id.toString()}
                                        getOptionLabel={(option) => (option as IProduct).name}
                                        value={products.find(product => product.id === value)}
                                        onChange={(newValue) => onChange((newValue as SingleValue<IProduct>)?.id)}
                                    />
                                )}
                            />
                            {errors.productId && <span className="text-red-500  mt-2">{errors.productId.message}</span>}
                        </div>
                        <div>
                            <label htmlFor="start" className=" font-medium block mb-2">Shift</label>
                            <select {...register('shift')} className="bg-gray-50 border border-gray-300 sm: rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-blue-500 block w-full p-2.5">
                                {
                                    shifts.map((shift, index) => (
                                        <option key={index} value={shift}>{shift}</option>
                                    ))
                                }
                            </select>
                        </div>
                        <div>
                            <p className=" font-medium block mb-2">Mục tiêu sản phẩm</p>
                            <p className="bg-gray-50 border border-gray-300 sm: rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-blue-500 block w-full p-2.5">{products.filter(product => product.id === watch('productId'))[0]?.target || 0}</p>
                        </div>
                        <div>
                            <label className=" font-medium block mb-2">Nhân viên</label>
                            <Controller
                                control={control}
                                name="workerId"
                                rules={{ required: 'Trường này không được để trống' }}
                                render={({ field: { onChange, value, name } }) => (
                                    <Select
                                        name={name}
                                        placeholder="Chọn nhân viên"
                                        noOptionsMessage={() => "Không có nhân viên nào"}
                                        isMulti
                                        options={ workers }
                                        getOptionValue={option => (option as IUser).id.toString()}
                                        getOptionLabel={option => (option as IUser).name}
                                        value={workers.filter(worker => value && value.includes(worker.id as never))}
                                        onChange={(newValue) => onChange((newValue as MultiValue<IUser>)?.map((user : IUser) => user.id) || [])}
                                    />
                                )}
                            />
                            { errors.workerId && <span className="text-red-500 mt-2">{errors.workerId.message}</span> }
                        </div>
                        {
                            currentAssemblyLine.status === "OFF" || currentAssemblyLine.status === "CANCELED" ? (
                                <button type="button" onClick={() => router.push('/assembly-line')} className="text-white w-full bg-gray-500 hover:bg-gray-600 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg  px-5 py-2.5 text-center">Quay lại</button>
                            ) : (
                                <div className="flex space-x-6">
                                    <button type="button" onClick={() => router.push('/assembly-line')} className="w-1/2 text-white bg-gray-500 hover:bg-gray-600 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg  px-5 py-2.5 text-center">Quay lại</button>
                                    <button type="submit" className="w-1/2 text-white bg-blue-500 hover:bg-blue-600 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg  px-5 py-2.5 text-center">Lưu</button>
                                </div>
                            )
                        }
                    </form>
                </div>
            </div>
        </>
    );
}

export default PageAssemblyLineEdit;