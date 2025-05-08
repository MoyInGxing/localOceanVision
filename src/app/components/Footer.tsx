'use client';

import Image from "next/image";
import Link from "next/link";
import { FaFacebookF, FaTwitter } from "react-icons/fa6";
import { CiInstagram } from "react-icons/ci";
import { useAuth } from "../context/AuthContext";

const Footer = () => {
    const { isLoggedIn } = useAuth();

    return (
        <main className="px-[5%] py-[40px] bg-white special-font">
            <section className="" data-aos="fade-down">
                <div className="flex justify-between flex-wrap gap-2">
                    <div className="flex flex-col gap-2 mb-5 md:mb-0 w-full md:w-auto items-center md:items-start justify-center md:justify-start">
                        <Image src="/img/footer-logo.png" width={100} height={100} alt="logo" />
                        <p className="text-[12px] text-litegrey font-semibold w-full md:max-w-[200px] text-center md:text-left">
                            智慧海洋牧场可视化系统 - 打造智能化海洋养殖管理平台
                        </p>
                    </div>

                    <div className="grid gap-4">
                        <h1 className="text[18px] text-litedark font-extrabold">主要功能</h1>
                        <div className="text-[15px] text-litegrey font-semibold flex flex-col gap-2">
                            <Link href="/dashboard" className="hover:text-orange transition delay-200">主要信息</Link>
                            <Link href="/underwater" className="hover:text-orange transition delay-200">水下系统</Link>
                            <Link href="/intelligence" className="hover:text-orange transition delay-200">智能中心</Link>
                            <Link href="/data-center" className="hover:text-orange transition delay-200">数据中心</Link>
                        </div>
                    </div>

                    <div className="grid gap-4">
                        <h1 className="text[18px] text-litedark font-extrabold">用户中心</h1>
                        <div className="text-[15px] text-litegrey font-semibold flex flex-col gap-2">
                            {!isLoggedIn ? (
                                <>
                                    <Link href="/login" className="hover:text-orange transition delay-200">用户登录</Link>
                                    <Link href="/register" className="hover:text-orange transition delay-200">用户注册</Link>
                                </>
                            ) : (
                                <>
                                    <Link href="/profile" className="hover:text-orange transition delay-200">个人中心</Link>
                                    <Link href="/dashboard" className="hover:text-orange transition delay-200">控制面板</Link>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="grid gap-4">
                        <h1 className="text[18px] text-litedark font-extrabold">管理功能</h1>
                        <div className="text-[15px] text-litegrey font-semibold flex flex-col gap-2">
                            <Link href="/admin/dashboard" className="hover:text-orange transition delay-200">管理控制台</Link>
                            <Link href="/admin/users" className="hover:text-orange transition delay-200">用户管理</Link>
                            <Link href="/admin/settings" className="hover:text-orange transition delay-200">系统设置</Link>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 items-center md:items-start justify-center md:justify-start w-full md:w-auto mt-5 md:mt-0">
                        <div className="flex items-center gap-4">
                            <FaFacebookF className="text-4xl p-2 text-litedark bg-white rounded-full shadow-md cursor-pointer hover:bg-gray-50 transition-colors" />
                            <CiInstagram className="text-4xl p-2 text-litedark bg-white rounded-full shadow-md cursor-pointer hover:bg-gray-50 transition-colors" />
                            <FaTwitter className="text-4xl p-2 text-litedark bg-white rounded-full shadow-md cursor-pointer hover:bg-gray-50 transition-colors" />
                        </div>

                        <p className="text-[20px] text-litegrey font-bold">联系我们</p>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center justify-center gap-1 bg-black py-2 px-5 rounded-full cursor-pointer hover:bg-gray-800 transition-colors">
                                <Image src="/img/google-play.png" width={20} height={20} alt="Google Play" />
                                <div>
                                    <h3 className="text-[13px] font-extrabold text-white">下载应用</h3>
                                    <p className="text-[11px] font-semi-bold text-white">ANDROID</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-center gap-1 bg-black py-2 px-5 rounded-full cursor-pointer hover:bg-gray-800 transition-colors">
                                <Image src="/img/apple.png" width={20} height={20} alt="App Store" />
                                <div>
                                    <h3 className="text-[11px] font-semibold text-white">下载应用</h3>
                                    <p className="text-[13px] font-extrabold text-white">IOS</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <p className="text-[14px] text-litegrey text-center font-normal mt-5">
                    智慧海洋牧场可视化系统 © {new Date().getFullYear()} 版权所有
                </p>
            </section>
        </main>
    );
}

export default Footer;