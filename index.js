const express = require('express')

const CLOUDFLARE_API_EMAIL = ''
const CLOUDFLARE_API_KEY = ''
const DNS_FROM = '177.234.155.218'
const DNS_TO = '187.45.184.99'

const cf = require('cloudflare')({
  email: CLOUDFLARE_API_EMAIL,
  key: CLOUDFLARE_API_KEY,
})

const app = express()
const port = 8000

async function getZones() {
  const zones = []

  // search total number of pages
  const res = await cf.zones.browse()
  const totalPages = res.result_info.total_pages

  // create an array with all zones
  for (let i = 1; i <= totalPages; i++) {
    const res = await cf.zones.browse(`page=${i}`)
    res.result.map((zone) => zones.push(zone))
  }

  return zones
}

async function getDNS(zones) {
  const dnss = []

  // create an array with all DNS
  for (let i = 0; i < zones.length; i++) {
    const res = await cf.dnsRecords.browse(zones[i].id)
    res.result.map((dns) => dnss.push(dns))
  }
  return dnss
}

async function updateDNS(dns) {
  return await cf.dnsRecords.edit(dns.zone_id, dns.id, {
    type: dns.type,
    name: dns.name,
    content: DNS_TO,
    ttl: dns.ttl,
  })
}

app.get('/', async (req, res) => {
  res.send('go to /update route to magic happens')
})

app.get('/update', async (req, res) => {
  const zones = await getZones()
  const dns = await getDNS(zones)

  const dnsToChange = dns.filter((dns) => dns.content == DNS_FROM)
  dnsToChange.map((dns) => updateDNS(dns))

  res.send(
    `Total searched domains: <strong>${zones.length}</strong> <br />
    Total DNS entries founded: <strong>${dns.length}</strong> <br />
    Total de DNS entries to 177.234.155.218: <strong>${dnsToChange.length}</strong> <br />
    Total de DNS entries changed to 187.45.184.99: <strong>${dnsToChange.length}</strong>`
  )
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
