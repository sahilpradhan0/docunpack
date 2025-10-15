import React from 'react'
import Header from './landingpage/components/Header'
import Footer from './landingpage/components/Footer'
import { Outlet } from 'react-router-dom'

const LandinPageLayout = () => {
    return (
        <div className="flex flex-col min-h-screen gap-20">
            <Header />
            <main className='flex-grow gap-20'>
                <Outlet />
            </main>
            <Footer />
        </div>
    )
}

export default LandinPageLayout