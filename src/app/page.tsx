import Login from "@/components/Login";
import Image from "next/image";

export default function Home() {
  return (
    <div className="grid md:grid-cols-2 flex-1 relative">
      <div className="absolute inset-0 w-full"></div>

      <div className="relative z-10 flex flex-col items-center justify-center p-4">
        <div className="space-y-1 flex flex-col items-center md:items-start">
          <Image src={"/FCLogo.svg"} alt="FC Logo" width={40} height={20} />
          <h1 className="font-serif text-9xl">FC OS</h1>
          <p className="font-semibold">
            Plan. Orchestrate. <span className="text-primary">Operate</span>.
          </p>
        </div>
      </div>
      <div className="relative z-10 flex items-start md:items-center justify-center p-4">
        <Login />
      </div>
    </div>
  );
}
