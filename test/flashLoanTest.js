const chai = require('chai');
const chaiHttp = require('chai-http');
const server = 'http://localhost:3005'; // API server
const { expect } = chai;

chai.use(chaiHttp);

describe('BSC USDT Flash Loan Fee API Tests', () => {
    it('should get flash loan premium rate for BSC', (done) => {
        chai.request(server)
            .get('/api/flash-loan/premium')
            .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.have.property('network', 'BSC Mainnet');
                expect(res.body).to.have.property('premium');
                expect(res.body).to.have.property('premiumPercentage');
                done();
            });
    });

    it('should calculate fee for 1000 USDT', (done) => {
        chai.request(server)
            .get('/api/flash-loan/calculate-fee/1000000')
            .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.have.property('token', 'USDT');
                expect(res.body).to.have.property('fee');
                done();
            });
    });

    it('should handle zero amount gracefully', (done) => {
        chai.request(server)
            .get('/api/flash-loan/calculate-fee/0')
            .end((err, res) => {
                expect(res).to.have.status(500);
                expect(res.body).to.have.property('error');
                done();
            });
    });

    it('should handle invalid amount format', (done) => {
        chai.request(server)
            .get('/api/flash-loan/calculate-fee/invalid')
            .end((err, res) => {
                expect(res).to.have.status(500);
                expect(res.body).to.have.property('error');
                done();
            });
    });
});
