const UserM3D = require('../models/UserM3D')

module.exports = {
    async store(req, res){
        const {email} = req.body;

       let user = await UserM3D.findOne({email});
        if (!user) {
            user = await UserM3D.create({email});
            return res.status(404).json({ success: false, message: 'Usuário não existe' });
        } else {
            
            return res.json({ success: true, message: 'Redirecionando para o dashboard' });
        }

        //const user = await UserM3D.create({email});

        //return res.json(user);
    }
};