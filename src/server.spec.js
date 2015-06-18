/* eslint-env mocha */

// Doc: https://github.com/moll/js-must/blob/master/doc/API.md#must
import expect from 'must'
import {getConnection} from './util'
import {map, find} from 'lodash'

// ===================================================================

describe('server', function () {
  let xo
  before(async function () {
    xo = await getConnection()
  })

  afterEach(async function () {
    await Promise.all(map(
      await getAllServers(),
      server => xo.call('server.remove', {id: server.id})
    ))
  })

  async function getAllServers () {
    return await xo.call('server.getAll')
  }

  async function getServer (id) {
    const servers = await getAllServers()
    return find(servers, {id: id})
  }

  // ==================================================================

  describe('.add()', function () {
    it('add a Xen server ans return its id', async function () {
      const serverId = await xo.call('server.add', {
        host: 'xen1.example.org',
        username: 'root',
        password: 'password',
        autoConnect: false
      })
      const server = await getServer(serverId)
      expect(server.id).to.be.a.string()
      expect(server).to.be.eql({
        id: serverId,
        host: 'xen1.example.org',
        username: 'root',
        status: 'disconnected'
      })
    })

    it.skip('does not create two servers with the same host', async function () {
      await xo.call('server.add', {
        host: 'xen1.example.org',
        username: 'root',
        password: 'password',
        autoConnect: false
      })

      await xo.call('server.add', {
        host: 'xen1.example.org',
        username: 'root',
        password: 'password',
        autoConnect: false
      }).then(
        function () {
          throw new Error('server.add() should have thrown')
        },
        function (error) {
          expect(error.message).to.match(/dupplicate server/i)
        })
    })
    it('set autoConnect true by default', async function () {
      const serverId = await xo.call('server.add', {
        host: '192.168.1.3',
        username: 'root',
        password: 'qwerty'
      })

      const server = await getServer(serverId)

      expect(server.id).to.be.equal(serverId)
      expect(server.host).to.be.equal('192.168.1.3')
      expect(server.username).to.be.equal('root')
      expect(server.status).to.be.match(/^connect(?:ed|ing)$/)
    })
  })

  // -----------------------------------------------------------------

  describe('.remove()', function () {
    it('remove a Xen server', async function () {
      const serverId = await xo.call('server.add', {
        host: 'xen1.example.org',
        username: 'root',
        password: 'password',
        autoConnect: false
      })

      await xo.call('server.remove', {
        id: serverId
      })

      const server = await getServer(serverId)
      expect(server).to.be.undefined()
    })
  })

  // -----------------------------------------------------------------

  describe('.getAll()', function () {
    it('returns an array', async function () {
      const servers = await xo.call('server.getAll')

      expect(servers).to.be.an.array()
    })
  })

  // -----------------------------------------------------------------

  describe('.set()', function () {
    it('chages attributes of an existinh server', async function () {
      const serverId = await xo.call('server.add', {
        host: 'xen1.example.org',
        username: 'root',
        password: 'password',
        autoConnect: false
      })

      await xo.call('server.set', {
        id: serverId,
        username: 'root2'
      })

      const server = await getServer(serverId)

      expect(server).to.be.eql({
        id: serverId,
        host: 'xen1.example.org',
        username: 'root2',
        status: 'disconnected'
      })
    })
  })

  // -----------------------------------------------------------------

  describe('.connect()', function () {
    it('connects to a Xen server', async function () {
      // 192.168.1.3 root:qwerty
      const serverId = await xo.call('server.add', {
        host: '192.168.1.3',
        username: 'root',
        password: 'qwerty',
        autoConnect: false
      })

      await xo.call('server.connect', {
        id: serverId
      })

      const server = await getServer(serverId)

      expect(server).to.be.eql({
        id: serverId,
        host: '192.168.1.3',
        username: 'root',
        status: 'connected'
      })
    })
  })

  // -----------------------------------------------------------------

  describe('.disconnect()', function () {
    this.timeout(30000)
    it('disconnects to a Xen server', async function () {
      const serverId = await xo.call('server.add', {
        host: '192.168.1.3',
        username: 'root',
        password: 'qwerty',
        autoConnect: false
      })

      await xo.call('server.connect', {
        id: serverId
      })

      await xo.call('server.disconnect', {
        id: serverId
      })

      const server = await getServer(serverId)
      expect(server).to.be.eql({
        id: serverId,
        host: '192.168.1.3',
        username: 'root',
        status: 'disconnected'
      })
    })
  })
})