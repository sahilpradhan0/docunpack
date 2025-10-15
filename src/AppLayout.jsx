import React, { useState } from 'react'
import Navbar from './components/Navbar'
import Footer from './landingpage/components/Footer'
import { Outlet, useLocation } from 'react-router-dom'
import UsageWarning from './components/UsageWarning'

const AppLayout = () => {
    const location = useLocation();
    const noNavbar = location.pathname === "/app/history";
    // const noWarning = location.pathname === "/app"
    return (
        <div className="flex flex-col min-h-screen gap-20">
            {!noNavbar && (
                <div>
                    {<UsageWarning />}
                    {<Navbar />}
                </div>
            )}
            <main className='flex-grow gap-30'>
                <Outlet />
            </main>
            <Footer />
        </div>
    )
}

export default AppLayout