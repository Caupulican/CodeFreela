import express, {Request,Response} from 'express'
import axios from 'axios'
import {Convert,JobsList,Post} from './dtoJobList'
const routes = express.Router()


interface responses {
  req : Request;
  res : Response;
}

const allLinks = async (responses : responses)=>{
  const jobs = await axios.get('https://backend.codefreela.com/projects/list?status=1&per_page=10&price=0&search&contract_type=0&order_by=points&skills&page=1').then(response => response.data).catch(response => console.log(response))
  const jobsList = Convert.toJobsList(JSON.stringify(jobs))
  jobsList.posts.forEach(Element =>{
    console.log(Element.resumo,Element.price, `https://codefreela.com/job/${Element.slug}`)
  })
  responses.res.send('OK')
}

routes.get('/links',allLinks)
module.exports = routes;
