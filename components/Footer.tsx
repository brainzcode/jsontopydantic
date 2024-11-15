import React from 'react';
// import { Github, Twitter } from 'lucide-react';

const Footer: React.FC = () => {
	return (
		<footer className='w-full py-6 border-t mt-8'>
			<div className='max-w-4xl mx-auto px-4'>
				<div className='flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0'>
					{/* <div className="flex items-center space-x-4">
            <a 
              href="https://github.com/yourusername/json-to-pydantic"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Github className="h-5 w-5" />
            </a>
            <a 
              href="https://twitter.com/yourusername"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Twitter className="h-5 w-5" />
            </a>
          </div> */}

					<div className='text-sm text-gray-600'>
						Built with{' '}❤️{' '}
						<a
							href='https://nextjs.org'
							target='_blank'
							rel='noopener noreferrer'
							className='text-blue-600 hover:text-blue-800 transition-colors'
						>
							Next.js
						</a>
					</div>

					<div className='text-sm text-gray-600'>
						© {new Date().getFullYear()}{' '}
						<a
							href='https://dataluminous.org'
							target='_blank'
							rel='noopener noreferrer'
							className='text-blue-600 hover:text-blue-800 transition-colors'
						>
							Data Luminous
						</a>
					</div>
				</div>
			</div>
		</footer>
	);
};

export default Footer;
