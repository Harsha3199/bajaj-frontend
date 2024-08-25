import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import Select from 'react-select';

const schema = yup.object().shape({
    testData: yup.string()
        .required("This field is required")
        .matches(/^([a-zA-Z0-9]+(,[a-zA-Z0-9]+)*)$/, "Only single characters and numbers are allowed!")
        .test('doesNotEndWithComma', 'Input should not end with a comma', value => !value.endsWith(','))
        .test('containsMixedTypesOrValid', 'Input must contain both single characters and numbers, or be valid with only characters', value => {
            if (!value) return false;
            const items = value.split(',').map(item => item.trim()).filter(Boolean);
            const hasSingleItem = items.every(item => /^[a-zA-Z0-9]+$/.test(item) && item.length === 1 || /^[0-9]+$/.test(item));
            const hasSingleChar = items.some(item => /^[a-zA-Z]$/.test(item));
            const hasNumber = items.some(item => /^[0-9]+$/.test(item));
            return (hasSingleChar || hasNumber) && hasSingleItem;
        })
});

const Home = () => {
    const [filterType, setFilterType] = useState(null);
    const [data, setData] = useState({
        numbers: [],
        alphabets: [],
        highest_lowercase_alphabet: []
    });
    const [filteredData, setFilteredData] = useState({
        numbers: [],
        alphabets: [],
        highest_lowercase_alphabet: []
    });
    const [filterOptions, setFilterOptions] = useState([
        { value: 'number', label: 'Number' },
        { value: 'alphabets', label: 'Alphabets' },
        { value: 'both', label: 'Both' },
    ]);

    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        resolver: yupResolver(schema),
    });

    useEffect(() => {
        const savedData = localStorage.getItem('data');
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            setData(parsedData);
            filterData(parsedData);
        }
    }, []);

    const handleFilterChange = selectedOptions => {
        const selectedValues = selectedOptions.map(option => option.value);
        if (selectedValues.includes('both')) {
            setFilterOptions(prevOptions =>
                prevOptions.map(option => ({
                    ...option,
                    isDisabled: option.value !== 'both'
                }))
            );
            setFilterType('both');
        } else {
            setFilterOptions(prevOptions =>
                prevOptions.map(option => ({
                    ...option,
                    isDisabled: false
                }))
            );
            // if (selectedValues.includes('number')) {
            //     setFilterType('number');
            // } else if (selectedValues.includes('alphabets')) {
            //     setFilterType('alphabets');
            // } else {
            //     setFilterType('');
            // }
            if (selectedValues.includes('alphabets') && (selectedValues.includes('number'))) {
                setFilterType('both');
            } else if (selectedValues.includes('alphabets')) {
                setFilterType('alphabets');
            } else if ( selectedValues.includes('number')) {
                setFilterType('number');
            } else {
                setFilterType('');
            }
        }
    };

    const handleSubmitData = async (data) => {
        try {
            const processedData = processInput(data);
            const response = await axios.post('https://api-bajaj-dun.vercel.app/bfhl', processedData);
            const responseData = response.data;
            setData(responseData);
             alert('Data is submitted');
            localStorage.setItem('data', JSON.stringify(responseData));
            filterData(responseData);
            reset();
        } catch (error) {
            console.log(error.message);
        }
    };

    const processInput = (input) => {
        const testData = input.testData;
        const items = testData.split(',').map(item => item.trim());
        return { data: items };
    };

    const filterData = (data) => {
        let filtered = {
            numbers: [],
            alphabets: [],
            highest_lowercase_alphabet: []
        };

        if (filterType === 'number') {
            filtered.numbers = data.numbers || [];
        } else if (filterType === 'alphabets') {
            filtered.alphabets = data.alphabets || [];
        } else if (filterType === 'both') {
            filtered = data;
        } else {
            filtered = null
        }

        setFilteredData(filtered);
    };

    useEffect(() => {
        filterData(data);
    }, [filterType]);

    return (
        <>
            <div className='w-full h-28 text-center flex justify-center items-center rounded-md border shadow-md'>
                <form onSubmit={handleSubmit(handleSubmitData)} className=''>
                    <input
                        className='border border-black shadow-md active:border-blue-500 mr-5 rounded-md py-1 pl-2'
                        placeholder='Enter your data'
                        {...register("testData")}
                    />
                    <button type='submit' className='border p-0 m-0 px-3 py-1 rounded-md bg-blue-500 text-white hover:bg-blue-300'>
                        Submit
                    </button>
                    <div>{errors.testData && <span className="text-red-500 text-sm">{errors.testData.message}</span>}</div>
                </form>
            </div>
            <div className='mt-4 rounded-md border shadow-md p-4'>
                <div className='w-full h-full'>
                    <div className="flex justify-center items-center">
                        <Select
                            isMulti
                            name="filters"
                            defaultValue={''}
                            options={filterOptions}
                            className="basic-multi-select w-[95%] mb-5 rounded-md shadow-md"
                            classNamePrefix="select"
                            onChange={handleFilterChange}
                        />
                    </div>
                    <h2 className='text-lg font-semibold'>Data:</h2>
                    <ul className='list-disc pl-5'>
                        {filteredData?.numbers.length > 0 || filteredData?.alphabets.length > 0 ? (
                            <>
                                {filteredData?.numbers.length > 0 && (
                                    <div className='bg-slate-300 rounded-md px-5 py-4 mb-3'>
                                        <h3 className='text-md font-semibold '>Numbers:</h3>
                                        {filteredData?.numbers.map((item, index) => (
                                            <p key={index} className='text-sm text-gray-700 '>{item}</p>
                                        ))}
                                    </div>
                                )}
                                {filteredData?.alphabets.length > 0 && (
                                    <div className='bg-slate-300 rounded-md px-5 py-4'>
                                        <h3 className='text-md font-semibold'>Alphabets:</h3>
                                        {filteredData?.alphabets.map((item, index) => (
                                            <p key={index} className='text-sm text-gray-700'>{item}</p>
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <li className='text-sm text-gray-700'>No data available</li>
                        )}
                    </ul>
                </div>
            </div>
        </>
    );
};

export default Home;
