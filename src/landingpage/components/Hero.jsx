import { useNavigate } from "react-router-dom"
import banner1 from "../../assets/banner.webp"
import { ArrowRight } from "lucide-react";
const Hero = () => {
  const nav = useNavigate();
  return (
    <main className="flex flex-col gap-10 justify-center items-center">
      <section className='flex flex-col justify-center items-center gap-5 px-2'>
        <h1 className='text-3xl md:text-5xl font-bold  text-center'>Understand Any API Doc Instantly — Powered by AI</h1>
        <h6 className='font-medium text-gray-600 text-md md:text-lg text-center'>Stop wasting hours deciphering technical documentation. Paste a link or text, and DocUnpack explains it in plain English — with follow-up Q&A to dive deeper.</h6>
        <button className='cursor-pointer bg-blue-500 text-white px-6 py-3 rounded-2xl hover:bg-blue-600 font-semibold text-lg' onClick={() => nav("/login")}>Get Started For Free</button>
      </section>
      <section className="bg-white border border-gray-300 rounded-xl ">
        <img src={banner1} className="rounded-xl " />
      </section>
    </main>
  )
}

export default Hero