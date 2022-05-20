Vue.createApp({
    data() {
      return {
        activeButton: 0,
        SN : 1,
        BD : true,
        RD : 2,
        AL : 2,
        SM : 2,
        OM : 2,
        VA : 0,
        PA : 16,
        LA : '1',     //Lab Num
        
        TM :  [],    //table MOPES
        Ct :  [],
        CO :  [],    //table ConvOOO
        CI :  [],    //table ConvIO
        TOt : [],
        TO :  [],    //table OOO
        TIt : [],
        TI :  [],    //table IO
      
        JO : -1,
        JI : -1,
        DO : -1,
        DI : -1,
        END : 0,
        OOO: 0,
        InO: 0
      }
    },
    methods:{
      start(){
        const codes  = this.codes(Num[this.VA], Num[Number(this.VA)+1],  MemReg[this.OM])
        const iter  = this.iter(codes)
        this.TM = this.tm(iter, codes)

        this.Ct = []
        this.Ct.push('№', 'Пачка')
        for(let i = 0; i < this.RD; i++) this.Ct.push('RD'+i)
        for(let i = 0; i < this.AL; i++) this.Ct.push('ALU'+i)
        for(let i = 0; i < this.SM; i++) this.Ct.push('SM'+i)
        this.Ct.push('SR')
        
        const iterOOO = this.iterOOO(iter, codes)
        this.TOt = []
        this.TOt.push('№','Инструкции')
        for(let i = 0; i<this.END + 10; i++) this.TOt.push(i)
        this.CO = this.co(iterOOO)
        this.TO = this.to(iterOOO, iter)

        const iterIO = this.iterIO(iter, codes)
        this.TIt = []
        this.TIt.push('№','Инструкции')
        for(let i = 0; i<this.END + 10; i++) this.TIt.push(i)
        this.CI = this.ci(iterIO)
        this.TI = this.ti(iterIO, iter)
        this.BD = false
        if(this.LA === '2'){
          const codes2 = this.codes2(codes)
          const iter2  = this.iter(codes2)
          this.TM = this.tm(iter2, codes)
          const iterOOO2 = this.iterOOO2(iter2, codes2)
          this.TOt = []
          this.TOt.push('№','Инструкции')
          for(let i = 0; i<this.END + 10; i++) this.TOt.push(i)
          this.CO = this.co(iterOOO2)
          this.TO = this.toj(iterOOO2, iterOOO, iter2)
          const iterIO2 = this.iterIO2(iter2, codes2)
          this.TIt = []
          this.TIt.push('№','Инструкции')
          for(let i = 0; i<this.END + 10; i++) this.TIt.push(i)
          this.CI = this.ci(iterIO2)
          this.TI = this.tij(iterIO2, iterIO, iter2)
        }
      },
      codes(Num1, Num2, MemReg){
        const codes = []
        for(let i = 0; i < Code.length; i++){
          const strCode = {id: i,
          str : Code[i] +' '+ MemReg[i] + Num1[i] +','+ MemReg[i + 50] + Num2[i] + ' ',
          vol : 0,
          type : Code[i][0],
          aNum : Num1[i],
          bNum : Num2[i],
          aType : MemReg[i],
          bType : MemReg[i + 50],
          lat : Latency[i]
          }
          if(strCode.aType === 'r' && strCode.bType === 'r') strCode.vol = Volrr[i]
          if(strCode.aType === 'r' && strCode.bType === 'm') strCode.vol = Volrm[i]
          if(strCode.aType === 'm' && strCode.bType === 'r') strCode.vol = Volmr[i]
          if(strCode.aType === 'm' && strCode.bType === 'm') strCode.vol = Volmm[i]
          strCode.str+=strCode.vol
          codes.push(strCode)
        }
        codes[9]={
          id: 9, 
          str: 'jcc addr15 6',
          vol: 6,
          type: 'j',
          lat: Latency[9],
          j: 15
        }
        codes[19]={
          id: 19, 
          str: 'jcc addr25 5',
          vol: 5,
          type: 'j',
          lat: Latency[19],
          j:25
        }
        codes[29]={
          id: 29, 
          str: 'jcc addr35 7',
          vol: 7,
          type: 'j',
          lat: Latency[29],
          j:35
        } 
        return codes
      },
      codes2(codes){
        const codes2 = []
        for(let i = 0; i < 10; i++){
          codes2.push(codes[i])
        }
        for(let i = 10; i < 15; i++){
          codes2.push({id: codes[i].id, str:codes[i].str, type: ''})
        }
        for(let i = 15; i < 50; i++){
          codes2.push(codes[i])
        }
        return codes2
      },
      iter(codes){
        const iter = []
        const mem = [false, false, false, false, false, false, false, false, false, false]
        let pathNum = 0
        let path = 0
        for(const code of codes){
          if( Number(code.vol) + path < this.PA+1){
            if(code.id !== 0) 
              if (codes[code.id - 1].type === 'j'){
                pathNum++
                path = Number(code.vol)
              }
            path += Number(code.vol)
          }else{
            pathNum++
            path = Number(code.vol)
          }

          const strIter = {id: code.id, path: pathNum, str: code.str, mops: [] , twoRead: false}

          if(code.type === 'm'){
            if( code.bType === 'm' && mem[code.bNum] === false){
                mem[code.bNum] = true
                strIter.mops.push('GA', 'SC', 'FB')
              }
            if(code.aType === 'm') strIter.mops.push('SM')
            else if (code.aType === 'r' && code.bType === 'r') strIter.mops.push('ME')
            else strIter.mops.push('SR')   
          }

          if(code.type==='p'){
            if( code.bType === 'm' && mem[code.bNum] === false && code.aType === 'm' && mem[code.aNum] === false){
              mem[code.aNum] = true
              mem[code.bNum] = true
              strIter.twoRead = true
              strIter.mops.push('GA', 'SC', 'FB')
            }else if( code.bType === 'm' && mem[code.bNum] === false){
              mem[code.bNum] = true
              strIter.mops.push('GA', 'SC', 'FB')
            }else if( code.aType === 'm' && mem[code.aNum] === false){
              mem[code.aNum] = true
              strIter.mops.push('GA', 'SC', 'FB')
            }
            strIter.mops.push('E')
            code.aType === 'm' ? strIter.mops.push('SM') : strIter.mops.push('SR') 
          }

          if(code.type === 'j') strIter.mops.push('J')

          iter.push(strIter)
        }
        return iter
      },
      tm(iter, codes){
        const table = []
        for (const cod of codes ){ 

          const strTable = [cod.str]
          let path = 0
          for(const i of iter){
            if(cod.id === i.id) {
              path = Number(i.path) % 2
              for(const mop of i.mops)strTable.push(mop)
              if(i.twoRead) {
                strTable[1]+='x2'
                strTable[2]+='x2'
                strTable[3]+='x2'
              } 
            }
          }
          while (strTable.length < 6) strTable.push(' ')
          
          table.push({str: strTable, path: path})
        }
        return table
      },
      iterOOO(iter, codes){
        const iterOOO = []
        const iterO = []
        for(let i of iter) 
          iterO.push({id: i.id, path: i.path, str: i.str, mops: i.mops, done: false,
             needDoneId: [], f: 5, fId: 0, lat: codes[i.id].lat})
                  
        for(let i=1; i< iterO.length; i++)
          if(codes[i].type === 'j') iterO[i].needDoneId.push(i-1)
          else for(let k=0; k < i; k++)
            if(codes[i].type !== 'j')
              if(codes[k].aType === codes[i].aType && codes[k].aNum === codes[i].aNum) iterO[i].needDoneId.push(k)
              else if (codes[k].aType === codes[i].bType && codes[k].aNum === codes[i].bNum) iterO[i].needDoneId.push(k)
          
        const rd = []
        for(let i = 0; i< this.RD; i++) rd.push({str: ' ', iter: ' ', k: 0})
        const alu = []
        for(let i = 0; i< this.AL; i++) alu.push({str: ' ', iter: ' ', k: 0})
        const sm = []
        for(let i = 0; i< this.SM; i++) sm.push({str: ' ', iter: ' '})
        let sr = {str: ' ', iter: []}

        let temp = 0
        let buf = []
        const buff = []
        const buffRead = []
        const buffALU = []
        const buffSM = []
        const buffSR = []
        for(let k = 0; k < iter.length; k++){
          buffRead.push('')
          buffALU.push('')
          buffSM.push('')
          buffSR.push('')
        }
        let m = 0
        while(m < 10){
          let strBuff = ''
          if(temp < iterO.length)
            for(let i of iterO) 
              if(i.path === temp) {
                strBuff += 'I'+i.id+' '
                i.fId = temp
                buf.push(i)
              }    
          for(let i = 0; i < buf.length; i++) {
            if(buf[i].f === 0){
              buff.push(buf[i])
              buf.splice(i,i+1)
              i--
            }
            else if(buf[i].f !== 0) buf[i].f--
          }
          while(buff.length > 0){
            if(buff[0].mops[0] === 'GA') buffRead[buff[0].id] = buff.shift() 
            else if(buff[0].mops[0] === 'E')  buffALU[buff[0].id] = buff.shift()
            else if(buff[0].mops[0] === 'J')  buffALU[buff[0].id] = buff.shift() 
            else if(buff[0].mops[0] === 'SM')  buffSM[buff[0].id] = buff.shift()
            else if(buff[0].mops[0] === 'SR')  buffSR[buff[0].id] = buff.shift()
            else if(buff[0].mops[0] === 'ME')  buffSR[buff[0].id] = buff.shift()
          }
          //------------SR----------------------
          sr = {str: '', iter: []} 
          //------------SM----------------------
          for(let i = 0; i< this.SM; i++)
              sm[i] = {str: ' ', iter: ' '}
          //------------ALU----------------------
          for(let i = 0; i < this.AL; i++)
            if(alu[i].str !== ' '){
              alu[i].k++
              if(alu[i].k > iterO[alu[i].iter.id].lat)
                if(codes[alu[i].iter.id].type === 'p'){
                  if(codes[alu[i].iter.id].aType === 'm')
                    buffSM[alu[i].iter.id] = alu[i].iter
                  else buffSR[alu[i].iter.id] = alu[i].iter
                  alu[i] = {str: ' ', iter: ' ', k: 0}
                }
                else if(codes[alu[i].iter.id].type === 'j'){
                  if(codes[alu[i].iter.id].id === 9) this.J1 = temp
                  alu[i] = {str: ' ', iter: ' ', k: 0}
                }
            }  
          //------------RD----------------------
          for(let i = 0; i < this.RD; i++)
            if(rd[i].str !== ' '){
              rd[i].k++
              if(rd[i].k > 2){
                if(codes[rd[i].iter.id].type === 'p')
                  buffALU[rd[i].iter.id] = rd[i].iter
                else if(codes[rd[i].iter.id].atype === 'm')
                  buffSM[rd[i].iter.id] = rd[i].iter
                else buffSR[rd[i].iter.id] = rd[i].iter
                rd[i] = {str: ' ', iter: ' ', k: 0}
              }
            }
          //------------SR----------------------
          let buffTemp = []
          for(const b of buffSR) if(b !== '') buffTemp.push(b)
          
          for(const b of buffTemp){  
            let done = true
            for(const need of b.needDoneId)
              if(iterO[need].done === false){done = false}
            if(done){
              sr.str += 'I' + b.id + ' '
              iterO[b.id].done = true
              sr.iter.push(b)
              buffSR[b.id] = ''
            }
          } 
          //------------RD----------------------
          for(let i = 0; i< this.RD; i++)
            if(rd[i].str === ' '){
              buffTemp = []
              for(const b of buffRead) if(b !== '') buffTemp.push(b)
              if(buffTemp.length > 0){
                rd[i].iter = buffTemp.shift()
                rd[i].str = 'I' + rd[i].iter.id
                rd[i].k = 0
                buffRead[rd[i].iter.id] = ''
              }
            }
          //------------ALU----------------------
          for(let i = 0; i < this.AL; i++)
            if(alu[i].str === ' '){
              buffTemp = []
              for(const b of buffALU) if(b !== '') buffTemp.push(b)
              if(buffTemp.length > 0){
                let buffTempId = -1
                for(let g = buffTemp.length; g > 0; g--){
                  let done = true
                  for(let k = 0; k < buffTemp[g-1].needDoneId.length; k++)
                    if(iterO[buffTemp[g-1].needDoneId[k]].done !== true){done = false}
                  if(done){buffTempId = g-1}
                }
                if(buffTempId !== -1){
                  alu[i].iter = buffTemp.splice(buffTempId, 1).shift()
                  alu[i].str = 'I' + alu[i].iter.id
                  buffALU[alu[i].iter.id] = ''
                }
              }
            }
          //------------SM----------------------
          for(let i = 0; i< this.SM; i++)
            if(sm[i].str === ' '){
              buffTemp = []
              for(const buf of buffSM) if(buf !== '') buffTemp.push(buf)
              if(buffTemp.length > 0){   
                let buffTempId = -1
                for(let g = buffTemp.length; g > 0; g--){
                  let done = true
                  for(let k = 0; k < buffTemp[g-1].needDoneId.length; k++)
                    if(iterO[buffTemp[g-1].needDoneId[k]].done !== true){done = false}
                  if(done){buffTempId = g-1}
                }
                if(buffTempId !== -1){         
                sm[i].iter = buffTemp.splice(buffTempId, 1).shift()
                iterO[sm[i].iter.id].done = true
                sm[i].str = 'I' + sm[i].iter.id
                buffSM[sm[i].iter.id] = ''
                }
              }
            }
          
          const buffEnd = [].concat(buffRead, buffALU, buffSM, buffSR)
          for(const buff of buffEnd) if(buff!=='') this.END = temp
          
          let rdStr = []
          let rdIterId = []
          for(const r of rd) {
            rdStr.push(r.str) 
            if(r.iter !== ' ')
              rdIterId.push(r.iter.id)
            else rdIterId.push(' ')
          }

          let aluStr = []
          let aluIterId = []
          for(const a of alu) {
            aluStr.push(a.str) 
            if(a.iter !== ' ')
              aluIterId.push(a.iter.id)
            else aluIterId.push(' ')
          }
          let smStr = []
          let smIterId = []
          for(const s of sm) {
            smStr.push(s.str) 
            if(s.iter !== ' ')
              smIterId.push(s.iter.id)
            else smIterId.push(' ')
          }
          let srIterId = []
          if(sr.iter.length>0)
            for(const s of sr.iter)  srIterId.push(s.id)

          let arrEnd = rdStr.concat(aluStr, smStr)
          for( let arr of arrEnd)
            if(arr !== ' ') m = 0
          if(sr.str !== '') m = 0
          m++

          const strIterOOO2= {id:temp, fId: [], strBuff: strBuff, rdStr: rdStr, rdIterId: rdIterId,
                                        aluStr:aluStr, aluIterId: aluIterId,
                                       smStr:smStr, smIterId: smIterId,
                                       srStr: sr.str, srIterId: srIterId }

          iterOOO.push(strIterOOO2)

          temp++
        }
        for(let iter of iterOOO)
          for(let i of iterO)
            if(i.fId === iter.id) iter.fId.push(i.id)
        return iterOOO
      },
      iterOOO2(iter2, codes2){
        this.J1 = -1
        const iterOOO = []
        const iterO = []
        for(let i=0; i<10; i++) 
          iterO.push({id: iter2[i].id, path: iter2[i].path, str: iter2[i].str, mops: iter2[i].mops, done: false,
          needDoneId: [], f: 5, fId: 0, lat: codes2[iter2[i].id].lat})
                  
        for(let i=1; i< iterO.length; i++)
          if(codes2[i].type === 'j') iterO[i].needDoneId.push(i-1)
          else for(let k=0; k < i; k++)
            if(codes2[i].type !== 'j')
              if(codes2[k].aType === codes2[i].aType && codes2[k].aNum === codes2[i].aNum) iterO[i].needDoneId.push(k)
              else if (codes2[k].aType === codes2[i].bType && codes2[k].aNum === codes2[i].bNum) iterO[i].needDoneId.push(k)
          
        const rd = []
        for(let i = 0; i< this.RD; i++) rd.push({str: ' ', iter: ' ', k: 0})
        const alu = []
        for(let i = 0; i< this.AL; i++) alu.push({str: ' ', iter: ' ', k: 0})
        const sm = []
        for(let i = 0; i< this.SM; i++) sm.push({str: ' ', iter: ' '})
        let sr = {str: ' ', iter: []}

        let temp = 0
        let buf = []
        const buff = []
        const buffRead = []
        const buffALU = []
        const buffSM = []
        const buffSR = []
        for(let k = 0; k < iter2.length; k++){
          buffRead.push('')
          buffALU.push('')
          buffSM.push('')
          buffSR.push('')
        }
        while(temp < 100){

          let strBuff = ''
          if(temp < iterO.length)
            for(let i of iterO) 
              if(i.path === temp) {
                strBuff += 'I'+i.id+' '
                i.fId = temp
                buf.push(i)
              }    
          for(let i = 0; i < buf.length; i++) {
            if(buf[i].f === 0){
              buff.push(buf[i])
              buf.splice(i,1)
              i--
            }
            else if(buf[i].f !== 0) buf[i].f--
          }
          while(buff.length > 0){
            if(buff[0].mops[0] === 'GA') buffRead[buff[0].id] = buff.shift() 
            else if(buff[0].mops[0] === 'E')  buffALU[buff[0].id] = buff.shift()
            else if(buff[0].mops[0] === 'J')  buffALU[buff[0].id] = buff.shift() 
            else if(buff[0].mops[0] === 'SM')  buffSM[buff[0].id] = buff.shift()
            else if(buff[0].mops[0] === 'SR')  buffSR[buff[0].id] = buff.shift()
            else if(buff[0].mops[0] === 'ME')  buffSR[buff[0].id] = buff.shift()
          }
          //------------SR----------------------
          sr = {str: '', iter: []} 
          //------------SM----------------------
          for(let i = 0; i< this.SM; i++)
              sm[i] = {str: ' ', iter: ' '}
          //------------ALU----------------------
          for(let i = 0; i < this.AL; i++)
            if(alu[i].str !== ' '){
              alu[i].k++
              if(alu[i].k > iterO[alu[i].iter.id].lat)
                if(codes2[alu[i].iter.id].type === 'p'){
                  if(codes2[alu[i].iter.id].aType === 'm')
                    buffSM[alu[i].iter.id] = alu[i].iter
                  else buffSR[alu[i].iter.id] = alu[i].iter
                  alu[i] = {str: ' ', iter: ' ', k: 0}
                }
                else if(codes2[alu[i].iter.id].type === 'j'){
                  alu[i] = {str: ' ', iter: ' ', k: 0}
                }
            }  
          //------------RD----------------------
          for(let i = 0; i < this.RD; i++)
            if(rd[i].str !== ' '){
              rd[i].k++
              if(rd[i].k > 2){
                if(codes2[rd[i].iter.id].type === 'p')
                  buffALU[rd[i].iter.id] = rd[i].iter
                else if(codes2[rd[i].iter.id].atype === 'm')
                  buffSM[rd[i].iter.id] = rd[i].iter
                else buffSR[rd[i].iter.id] = rd[i].iter
                rd[i] = {str: ' ', iter: ' ', k: 0}
              }
            }
          //------------SR----------------------
          let buffTemp = []
          for(const b of buffSR) if(b !== '') buffTemp.push(b)
          
          for(const b of buffTemp){  
            let done = true
            for(const need of b.needDoneId)
              if(iterO[need].done === false){done = false}
            if(done){
              sr.str += 'I' + b.id + ' '
              iterO[b.id].done = true
              sr.iter.push(b)
              buffSR[b.id] = ''
            }
          }
          //------------RD----------------------
          for(let i = 0; i< this.RD; i++)
            if(rd[i].str === ' '){
              buffTemp = []
              for(const buf of buffRead) if(buf !== '') buffTemp.push(buf)
              if(buffTemp.length > 0){
                rd[i].iter = buffTemp.shift()
                rd[i].str = 'I' + rd[i].iter.id
                rd[i].k = 0
                buffRead[rd[i].iter.id] = ''
              }
            }
          //------------ALU----------------------
          for(let i = 0; i < this.AL; i++)
            if(alu[i].str === ' '){
              buffTemp = []
              for(const buf of buffALU) if(buf !== '') buffTemp.push(buf)
              if(buffTemp.length > 0){
                let buffTempId = -1
                for(let g = buffTemp.length; g > 0; g--){
                  let done = true
                  for(let k = 0; k < buffTemp[g-1].needDoneId.length; k++)
                    if(iterO[buffTemp[g-1].needDoneId[k]].done !== true){done = false}
                  if(done){buffTempId = g-1}
                }
                if(buffTempId !== -1){
                  alu[i].iter = buffTemp.splice(buffTempId, 1).shift()
                  alu[i].str = 'I' + alu[i].iter.id
                  buffALU[alu[i].iter.id] = ''
                  if(alu[i].iter.id === 9) 
                    this.JO = temp + alu[i].iter.lat
                }
              }
            }
          //------------SM----------------------
          for(let i = 0; i< this.SM; i++)
            if(sm[i].str === ' '){
              buffTemp = []
              for(const buf of buffSM) if(buf !== '') buffTemp.push(buf)
              if(buffTemp.length > 0){   
                let buffTempId = -1
                for(let g = buffTemp.length; g > 0; g--){
                  let done = true
                  for(let k = 0; k < buffTemp[g-1].needDoneId.length; k++)
                    if(iterO[buffTemp[g-1].needDoneId[k]].done !== true){done = false}
                  if(done){buffTempId = g-1}
                }
                if(buffTempId !== -1){         
                sm[i].iter = buffTemp.splice(buffTempId, 1).shift()
                iterO[sm[i].iter.id].done = true
                sm[i].str = 'I' + sm[i].iter.id
                buffSM[sm[i].iter.id] = ''
                }
              }
            }
          
          const buffEnd = [].concat(buffRead, buffALU, buffSM, buffSR)
          for(const buff of buffEnd) if(buff!=='') this.END = temp
          
          let rdStr = []
          let rdIterId = []
          for(const r of rd) {
            rdStr.push(r.str) 
            if(r.iter !== ' ')
              rdIterId.push(r.iter.id)
            else rdIterId.push(' ')
          }

          let aluStr = []
          let aluIterId = []
          for(const a of alu) {
            aluStr.push(a.str) 
            if(a.iter !== ' ')
              aluIterId.push(a.iter.id)
            else aluIterId.push(' ')
          }
          let smStr = []
          let smIterId = []
          for(const s of sm) {
            smStr.push(s.str) 
            if(s.iter !== ' ')
              smIterId.push(s.iter.id)
            else smIterId.push(' ')
          }
          let srIterId = []
          if(sr.iter.length>0)
            for(const s of sr.iter)  srIterId.push(s.id)

          const strIterOOO2= {id:temp, fId: [], strBuff: strBuff, rdStr: rdStr, rdIterId: rdIterId,
                                        aluStr:aluStr, aluIterId: aluIterId,
                                       smStr:smStr, smIterId: smIterId,
                                       srStr: sr.str, srIterId: srIterId }

          iterOOO.push(strIterOOO2)

          if(temp === this.JO){
            const pathP = (temp - Number(iter2[15].path))+1
            iterO.splice(10,0,iter2[10],iter2[11],iter2[12],iter2[13],iter2[14])
            for(let i= 15; i < iter2.length; i++) {
              iterO.push({id: iter2[i].id, path: iter2[i].path+pathP, str: iter2[i].str, mops: iter2[i].mops, done: false,
              needDoneId: [], f: 5, fId: 0, lat: codes2[iter2[i].id].lat})
            }
                  
            for(let i=15; i< iterO.length; i++)
              if(codes2[i].type === 'j') 
                iterO[i].needDoneId.push(iterO[i].id-1)
              else for(let k=0; k < i; k++)
                if(codes2[i].type !== 'j')
                  if(codes2[k].aType === codes2[i].aType && codes2[k].aNum === codes2[i].aNum && codes2[k].aType !== undefined) 
                    iterO[i].needDoneId.push(k)
                  else if (codes2[k].aType === codes2[i].bType && codes2[k].aNum === codes2[i].bNum&& codes2[k].aType !== undefined) 
                    iterO[i].needDoneId.push(k)
            
          }

          temp++
        }
        for(let iter of iterOOO)
          for(let i of iterO)
            if(i.fId === iter.id) iter.fId.push(i.id)

        return iterOOO
      },
      iterIO(iter, codes){
        const iterIO = []
        const iterO = []
        for(let i of iter) 
          iterO.push({id: i.id, path: i.path, str: i.str, mops: i.mops, done: false,
             needDoneId: [], f: 5, fId: 0, lat: codes[i.id].lat , start: false})
                  
        for(let i=1; i< iterO.length; i++)
          if(codes[i].type === 'j') iterO[i].needDoneId.push(i-1)
          else for(let k=0; k < i; k++)
            if(codes[i].type !== 'j')
              if(codes[k].aType === codes[i].aType && codes[k].aNum === codes[i].aNum) iterO[i].needDoneId.push(k)
              else if (codes[k].aType === codes[i].bType && codes[k].aNum === codes[i].bNum) iterO[i].needDoneId.push(k)
          
        const rd = []
        for(let i = 0; i< this.RD; i++) rd.push({str: ' ', iter: ' ', k: 0})
        const alu = []
        for(let i = 0; i< this.AL; i++) alu.push({str: ' ', iter: ' ', k: 0})
        const sm = []
        for(let i = 0; i< this.SM; i++) sm.push({str: ' ', iter: ' '})
        let sr = {str: ' ', iter: []}

        let temp = 0
        let buf = []
        const buff = []
        const buffRead = []
        const buffALU = []
        const buffSM = []
        const buffSR = []
        for(let k = 0; k < iter.length; k++){
          buffRead.push('')
          buffALU.push('')
          buffSM.push('')
          buffSR.push('')
        }
        let m = 0
        while(m < 10){
          let strBuff = ''
          if(temp < iterO.length)
            for(let i of iterO) 
              if(i.path === temp) {
                strBuff += 'I'+i.id+' '
                i.fId = temp
                buf.push(i)
              }    
          for(let i = 0; i < buf.length; i++) {
            if(buf[i].f === 0){
              buff.push(buf[i])
              buf.splice(i,1)
              i--
            }
            else if(buf[i].f !== 0) buf[i].f--
          }
          while(buff.length > 0){
            if(buff[0].mops[0] === 'GA') buffRead[buff[0].id] = buff.shift()
            else if(buff[0].mops[0] === 'E')  buffALU[buff[0].id] = buff.shift()
            else if(buff[0].mops[0] === 'J')  buffALU[buff[0].id] = buff.shift()
            else if(buff[0].mops[0] === 'SM')  buffSM[buff[0].id] = buff.shift()
            else if(buff[0].mops[0] === 'SR')  buffSR[buff[0].id] = buff.shift()
            else if(buff[0].mops[0] === 'ME')  buffSR[buff[0].id] = buff.shift()
          }
          
          //------------SR----------------------
          sr = {str: '', iter: []} 

          //------------SM----------------------
          for(let i = 0; i< this.SM; i++)
              sm[i] = {str: ' ', iter: ' '}
            
          //------------ALU----------------------
          for(let i = 0; i < this.AL; i++)
            if(alu[i].str !== ' '){
              alu[i].k++
              if(alu[i].k > iterO[alu[i].iter.id].lat)
                if(codes[alu[i].iter.id].type === 'p'){
                  if(codes[alu[i].iter.id].aType === 'm')
                    buffSM[alu[i].iter.id] = alu[i].iter
                  else buffSR[alu[i].iter.id] = alu[i].iter
                  alu[i] = {str: ' ', iter: ' ', k: 0}
                }
                else if(codes[alu[i].iter.id].type === 'j'){
                  if(codes[alu[i].iter.id].id === 9) this.J1 = temp
                  alu[i] = {str: ' ', iter: ' ', k: 0}
                }
            }

          //------------RD----------------------
          for(let i = 0; i < this.RD; i++)
            if(rd[i].str !== ' '){
              rd[i].k++
              if(rd[i].k > 2){
                if(codes[rd[i].iter.id].type === 'p')
                  buffALU[rd[i].iter.id] = rd[i].iter
                else if(codes[rd[i].iter.id].atype === 'm')
                  buffSM[rd[i].iter.id] = rd[i].iter
                else buffSR[rd[i].iter.id] = rd[i].iter
                rd[i] = {str: ' ', iter: ' ', k: 0}
              }
            }
                 
          //------------SR----------------------
          let buffTemp = []
          for(const b of buffSR) if(b !== '') buffTemp.push(b)
          
          for(const b of buffTemp){  
            let done = true
            for(const need of b.needDoneId)
              if(iterO[need].done === false){done = false}
            if(b.id>0)
              if(iterO[b.id-1].start !== true){done = false}
            
            if(done){
              sr.str += 'I' + b.id + ' '
              iterO[b.id].done = true
              sr.iter.push(b)
              buffSR[b.id] = ''
              iterO[b.id].start = true
            }
          }
         
          //------------RD----------------------
          for(let i = 0; i< this.RD; i++)
            if(rd[i].str === ' '){
              buffTemp = []
              for(const b of buffRead) if(b !== '') buffTemp.push(b)
              if(buffTemp.length > 0){
                rd[i].iter = buffTemp.shift()
                rd[i].str = 'I' + rd[i].iter.id
                rd[i].k = 0
                buffRead[rd[i].iter.id] = ''
              }
            }
                      
          //------------ALU----------------------
          for(let i = 0; i < this.AL; i++)
            if(alu[i].str === ' '){
              buffTemp = []
              for(const b of buffALU) if(b !== '') buffTemp.push(b)
              if(buffTemp.length > 0){
                let buffTempId = -1
                for(let g = buffTemp.length; g > 0; g--){
                  let done = true
                  for(let k = 0; k < buffTemp[g-1].needDoneId.length; k++)
                    if(iterO[buffTemp[g-1].needDoneId[k]].done === false){done = false}
                  if(buffTemp[g-1].id > 0)
                    if(iterO[buffTemp[g-1].id - 1].start === false){done = false}
                  if(done){buffTempId = g-1}
                }
                if(buffTempId !== -1){
                  alu[i].iter = buffTemp.splice(buffTempId, 1).shift()
                  alu[i].str = 'I' + alu[i].iter.id
                  buffALU[alu[i].iter.id] = ''
                  iterO[alu[i].iter.id].start = true
                }
              }
            }
          
          //------------SM----------------------
          for(let i = 0; i< this.SM; i++)
            if(sm[i].str === ' '){
              buffTemp = []
              for(const b of buffSM) if(b !== '') buffTemp.push(b)
              if(buffTemp.length > 0){   
                let buffTempId = -1
                for(let g = buffTemp.length; g > 0; g--){
                  let done = true
                  for(let k = 0; k < buffTemp[g-1].needDoneId.length; k++)
                    if(iterO[buffTemp[g-1].needDoneId[k]].done !== true){done = false}
                  if(buffTemp[g-1].id > 0)
                    if(iterO[buffTemp[g-1].id - 1].start === false){done = false}
                  if(done){buffTempId = g-1}
                }
                if(buffTempId !== -1){         
                sm[i].iter = buffTemp.splice(buffTempId, 1).shift()
                iterO[sm[i].iter.id].done = true
                sm[i].str = 'I' + sm[i].iter.id
                buffSM[sm[i].iter.id] = ''
                iterO[sm[i].iter.id].start = true
                }
              }
            }
                    
          const buffEnd = [].concat(buffRead, buffALU, buffSM, buffSR)
          for(const b of buffEnd) if(b!=='') this.END = temp
          
          let rdStr = []
          let rdIterId = []
          for(const r of rd) {
            rdStr.push(r.str) 
            if(r.iter !== ' ')
              rdIterId.push(r.iter.id)
            else rdIterId.push(' ')
          }

          let aluStr = []
          let aluIterId = []
          for(const a of alu) {
            aluStr.push(a.str) 
            if(a.iter !== ' ')
              aluIterId.push(a.iter.id)
            else aluIterId.push(' ')
          }
          let smStr = []
          let smIterId = []
          for(const s of sm) {
            smStr.push(s.str) 
            if(s.iter !== ' ')
              smIterId.push(s.iter.id)
            else smIterId.push(' ')
          }
          let srIterId = []
          if(sr.iter.length>0)
            for(const s of sr.iter)  srIterId.push(s.id)


          let arrEnd = rdStr.concat(aluStr, smStr)
          for( let arr of arrEnd)
            if(arr !== ' ') m = 0
          if(sr.str !== '') m = 0
          m++

          const strIterOOO2= {id:temp, fId: [], strBuff: strBuff, rdStr: rdStr, rdIterId: rdIterId,
                                        aluStr:aluStr, aluIterId: aluIterId,
                                       smStr:smStr, smIterId: smIterId,
                                       srStr: sr.str, srIterId: srIterId }

          iterIO.push(strIterOOO2)
          temp++
        }
        for(let iter of iterIO)
          for(let i of iterO)
            if(i.fId === iter.id) iter.fId.push(i.id)

        return iterIO
      },
      iterIO2(iter2, codes2){
        this.J1 = -1
        const iterIO2 = []
        const iterO = []
        for(let i=0; i<10; i++) 
          iterO.push({id: iter2[i].id, path: iter2[i].path, str: iter2[i].str, mops: iter2[i].mops, done: false,
          needDoneId: [], f: 5, fId: 0, lat: codes2[iter2[i].id].lat, start: false})
                  
          for(let i=1; i< iterO.length; i++)
          if(codes2[i].type === 'j') iterO[i].needDoneId.push(i-1)
          else for(let k=0; k < i; k++)
            if(codes2[i].type !== 'j')
              if(codes2[k].aType === codes2[i].aType && codes2[k].aNum === codes2[i].aNum) iterO[i].needDoneId.push(k)
              else if (codes2[k].aType === codes2[i].bType && codes2[k].aNum === codes2[i].bNum) iterO[i].needDoneId.push(k)
          
        const rd = []
        for(let i = 0; i< this.RD; i++) rd.push({str: ' ', iter: ' ', k: 0})
        const alu = []
        for(let i = 0; i< this.AL; i++) alu.push({str: ' ', iter: ' ', k: 0})
        const sm = []
        for(let i = 0; i< this.SM; i++) sm.push({str: ' ', iter: ' '})
        let sr = {str: ' ', iter: []}

        let temp = 0
        let buf = []
        const buff = []
        const buffRead = []
        const buffALU = []
        const buffSM = []
        const buffSR = []
        for(let k = 0; k < iter2.length; k++){
          buffRead.push('')
          buffALU.push('')
          buffSM.push('')
          buffSR.push('')
        }

        while(temp < 100){
          let strBuff = ''
          if(temp < iterO.length)
            for(let i of iterO) 
              if(i.path === temp) {
                strBuff += 'I'+i.id+' '
                i.fId = temp
                buf.push(i)
              }    
          for(let i = 0; i < buf.length; i++) {
            if(buf[i].f === 0){
              buff.push(buf[i])
              buf.splice(i,1)
              i--
            }
            else if(buf[i].f !== 0) buf[i].f--
          }
          while(buff.length > 0){
            if(buff[0].mops[0] === 'GA') buffRead[buff[0].id] = buff.shift() 
            else if(buff[0].mops[0] === 'E')  buffALU[buff[0].id] = buff.shift()
            else if(buff[0].mops[0] === 'J')  buffALU[buff[0].id] = buff.shift() 
            else if(buff[0].mops[0] === 'SM')  buffSM[buff[0].id] = buff.shift()
            else if(buff[0].mops[0] === 'SR')  buffSR[buff[0].id] = buff.shift()
            else if(buff[0].mops[0] === 'ME')  buffSR[buff[0].id] = buff.shift()
          }
          //------------SR----------------------
          sr = {str: '', iter: []} 
          //------------SM----------------------
          for(let i = 0; i< this.SM; i++)
              sm[i] = {str: ' ', iter: ' '}
          //------------ALU----------------------
          for(let i = 0; i < this.AL; i++)
            if(alu[i].str !== ' '){
              alu[i].k++
              if(alu[i].k > iterO[alu[i].iter.id].lat)
                if(codes2[alu[i].iter.id].type === 'p'){
                  if(codes2[alu[i].iter.id].aType === 'm')
                    buffSM[alu[i].iter.id] = alu[i].iter
                  else buffSR[alu[i].iter.id] = alu[i].iter
                  alu[i] = {str: ' ', iter: ' ', k: 0}
                }
                else if(codes2[alu[i].iter.id].type === 'j'){
                  //if(codes[alu[i].iter.id].id === 9) this.J1 = temp
                  alu[i] = {str: ' ', iter: ' ', k: 0}
                }
            }  
          //------------RD----------------------
          for(let i = 0; i < this.RD; i++)
            if(rd[i].str !== ' '){
              rd[i].k++
              if(rd[i].k > 2){
                if(codes2[rd[i].iter.id].type === 'p')
                  buffALU[rd[i].iter.id] = rd[i].iter
                else if(codes2[rd[i].iter.id].atype === 'm')
                  buffSM[rd[i].iter.id] = rd[i].iter
                else buffSR[rd[i].iter.id] = rd[i].iter
                rd[i] = {str: ' ', iter: ' ', k: 0}
              }
            }
          //------------SR----------------------
          let buffTemp = []
          for(const b of buffSR) if(b !== '') buffTemp.push(b)
          
          for(const b of buffTemp){  
            let done = true
            for(const need of b.needDoneId)
              if(iterO[need].done === false){done = false}
            if(b.id>0 && b.id !== 15)
              if(iterO[b.id-1].start !== true){done = false}
            if(done){
              sr.str += 'I' + b.id + ' '
              iterO[b.id].done = true
              sr.iter.push(b)
              buffSR[b.id] = ''
              iterO[b.id].start = true
            }
          }
          //------------RD----------------------
          for(let i = 0; i< this.RD; i++)
            if(rd[i].str === ' '){
              buffTemp = []
              for(const b of buffRead) if(b !== '') buffTemp.push(b)
              if(buffTemp.length > 0){
                rd[i].iter = buffTemp.shift()
                rd[i].str = 'I' + rd[i].iter.id
                rd[i].k = 0
                buffRead[rd[i].iter.id] = ''
              }
            }
          //------------ALU----------------------
          for(let i = 0; i < this.AL; i++)
            if(alu[i].str === ' '){
              buffTemp = []
              for(const b of buffALU) if(b !== '') buffTemp.push(b)
              if(buffTemp.length > 0){
                let buffTempId = -1
                for(let g = buffTemp.length; g > 0; g--){
                  let done = true
                  for(let k = 0; k < buffTemp[g-1].needDoneId.length; k++)
                    if(iterO[buffTemp[g-1].needDoneId[k]].done !== true){done = false}
                  if(buffTemp[g-1].id > 0 && buffTemp[g-1].id !== 15)
                    if(iterO[buffTemp[g-1].id - 1].start === false){done = false}
                  if(done){buffTempId = g-1}
                }
                if(buffTempId !== -1){
                  alu[i].iter = buffTemp.splice(buffTempId, 1).shift()
                  alu[i].str = 'I' + alu[i].iter.id
                  buffALU[alu[i].iter.id] = ''
                  iterO[alu[i].iter.id].start = true
                  if(alu[i].iter.id === 9) 
                    this.JI = temp + alu[i].iter.lat
                }
              }
            }
          //------------SM----------------------
          for(let i = 0; i< this.SM; i++)
            if(sm[i].str === ' '){
              buffTemp = []
              for(const b of buffSM) if(b !== '') buffTemp.push(b)
              if(buffTemp.length > 0){   
                let buffTempId = -1
                for(let g = buffTemp.length; g > 0; g--){
                  let done = true
                  for(let k = 0; k < buffTemp[g-1].needDoneId.length; k++)
                    if(iterO[buffTemp[g-1].needDoneId[k]].done !== true){done = false}
                  if(buffTemp[g-1].id > 0 && buffTemp[g-1].id !== 15)
                    if(iterO[buffTemp[g-1].id - 1].start === false){done = false}
                  if(done){buffTempId = g-1}
                }
                if(buffTempId !== -1){         
                sm[i].iter = buffTemp.splice(buffTempId, 1).shift()
                iterO[sm[i].iter.id].done = true
                sm[i].str = 'I' + sm[i].iter.id
                buffSM[sm[i].iter.id] = ''
                iterO[sm[i].iter.id].start = true
                }
              }
            }
          
          const buffEnd = [].concat(buffRead, buffALU, buffSM, buffSR)
          for(const b of buffEnd) if(b!=='') this.END = temp
          
          let rdStr = []
          let rdIterId = []
          for(const r of rd) {
            rdStr.push(r.str) 
            if(r.iter !== ' ')
              rdIterId.push(r.iter.id)
            else rdIterId.push(' ')
          }

          let aluStr = []
          let aluIterId = []
          for(const a of alu) {
            aluStr.push(a.str) 
            if(a.iter !== ' ')
              aluIterId.push(a.iter.id)
            else aluIterId.push(' ')
          }
          let smStr = []
          let smIterId = []
          for(const s of sm) {
            smStr.push(s.str) 
            if(s.iter !== ' ')
              smIterId.push(s.iter.id)
            else smIterId.push(' ')
          }
          let srIterId = []
          if(sr.iter.length>0)
            for(const s of sr.iter)  srIterId.push(s.id)

          const strIterOOO2= {id:temp, fId: [], strBuff: strBuff, rdStr: rdStr, rdIterId: rdIterId,
                                        aluStr:aluStr, aluIterId: aluIterId,
                                       smStr:smStr, smIterId: smIterId,
                                       srStr: sr.str, srIterId: srIterId }

          iterIO2.push(strIterOOO2)

          if(temp === this.JI){
            const pathP = (temp - Number(iter2[15].path))+1
            iterO.splice(10,0,iter2[10],iter2[11],iter2[12],iter2[13],iter2[14])
            for(let i= 15; i < iter2.length; i++) {
              iterO.push({id: iter2[i].id, path: iter2[i].path+pathP, str: iter2[i].str, mops: iter2[i].mops, done: false,
              needDoneId: [], f: 5, fId: 0, lat: codes2[iter2[i].id].lat, start: false})
            }
                  
            for(let i=15; i< iterO.length; i++)
              if(codes2[i].type === 'j') 
                iterO[i].needDoneId.push(iterO[i].id-1)
              else for(let k=0; k < i; k++)
                if(codes2[i].type !== 'j')
                  if(codes2[k].aType === codes2[i].aType && codes2[k].aNum === codes2[i].aNum && codes2[k].aType !== undefined) 
                    iterO[i].needDoneId.push(k)
                  else if (codes2[k].aType === codes2[i].bType && codes2[k].aNum === codes2[i].bNum&& codes2[k].aType !== undefined) 
                    iterO[i].needDoneId.push(k)
          }

          temp++
        }
        for(let iter of iterIO2)
          for(let i of iterO)
            if(i.fId === iter.id) iter.fId.push(i.id)

        return iterIO2
      },
      co(iterOOO){
        const table = []
        const end = (this.END < 50) ? 50 : this.END
        for(let i = 0; i < end; i++){
          const iter = iterOOO[i]
          let strTable = [i, iter.strBuff]
          strTable = strTable.concat(iter.rdStr, iter.aluStr, iter.smStr) 
          strTable.push(iter.srStr)
          table.push(strTable)
        }
        return table    
      },
      to(iterOOO, iter){
        let table = []
        for(let i = 0; i < iter.length; i++){
          const strTable = [{str:i,color:0}, {str:iter[i].str,color:0}]
          for(let k = 0; k < this.END + 10; k++) strTable.push({str:' ', color: 0})
          table.push(strTable)
        }
        for(const iterO of iterOOO){
          for(const f of iterO.fId){
            table[f][iterO.id+2].str = 'F'
            table[f][iterO.id+3].str = 'F'
            table[f][iterO.id+4].str = 'F'
            table[f][iterO.id+5].str = 'F'
            table[f][iterO.id+6].str = 'F'
          }
          for(let i = 0; i < iterO.rdStr.length; i++) 
            if(iterO.rdStr[i] !== ' ') 
              table[iterO.rdIterId[i]][iterO.id+2].str = 'R'
          for(let i = 0; i < iterO.aluStr.length; i++) 
            if(iterO.aluStr[i] !== ' ') {
              if(iter[iterO.aluIterId[i]].str[0] !== 'j')
                table[iterO.aluIterId[i]][iterO.id+2].str = 'E'
              else{table[iterO.aluIterId[i]][iterO.id+2].str = 'J'}
            }  
          for(let i = 0; i < iterO.smStr.length; i++) 
            if(iterO.smStr[i] !== ' '){ 
              table[iterO.smIterId[i]][iterO.id+2].str = 'SM'
              }
          for(let i = 0; i < iterO.srIterId.length; i++) 
            if(iterO.srIterId[i] !== ' ') 
              table[iterO.srIterId[i]][iterO.id+2].str = 'SR'  
        }
        let idT = 0
        for(let t = 0; t < table.length; t++){
        
          let s = 0
          // if(t < 10 || t > 14)
          for( let i = 2; i< table[t].length; i++)
            if(table[t][i].str !== ' ') s = i
          if(s !== 0){
            table[t][s+1].str='C'
            table[t][s+2].str='W'
            let k = 1
            while(s+2+k < idT){
              table[t][s+2+k].str='W'
            k++
            }
            table[t][s+2+k].str='T'
            idT=s+2+k
          } 
        }

        return table
      },
      toj(iterOOO2, iterOOO, iter){
        let table = []
        for(let i = 0; i < iter.length; i++){
          const strTable = [{str:i,color:0}, {str:iter[i].str,color:0}]
          for(let k = 0; k < this.END + 10; k++) strTable.push({str:' ', color: 0})
          table.push(strTable)
        }
        for(let k = 0; k <this.JO+1; k++){
          for(let g = 0; g < iterOOO[k].fId.length; g++)
            if(iterOOO[k].fId[g] > 9)
              for(let h = 2; h < 7; h++)
                if(iterOOO[k].id+h < this.JO + 1)
                table[iterOOO[k].fId[g]][iterOOO[k].id+h] = {str:'F', color: 1}
            
          for(let i = 0; i < iterOOO[k].rdStr.length; i++) 
            if(iterOOO[k].rdStr[i] !== ' ' && iterOOO[k].rdIterId[i] > 9) 
              table[iterOOO[k].rdIterId[i]][iterOOO[k].id+2] = {str:'R', color: 1}
          for(let i = 0; i < iterOOO[k].aluStr.length; i++) 
            if(iterOOO[k].aluStr[i] !== ' ' && iterOOO[k].aluIterId[i] > 9) {
              if(iter[iterOOO[k].aluIterId[i]].str[0] !== 'j')
                table[iterOOO[k].aluIterId[i]][iterOOO[k].id+2] = {str:'E', color: 1}
              else{table[iterOOO[k].aluIterId[i]][iterOOO[k].id+2] = {str:'J', color: 1}}
            }  
          for(let i = 0; i < iterOOO[k].smStr.length; i++) 
            if(iterOOO[k].smStr[i] !== ' ' && iterOOO[k].smIterId[i] > 9){ 
              table[iterOOO[k].smIterId[i]][iterOOO[k].id+2] = {str:'SM', color: 1}
              }
          for(let i = 0; i < iterOOO[k].srIterId.length; i++) 
            if(iterOOO[k].srIterId[i] !== ' ' && iterOOO[k].srIterId[i] > 9) 
              table[iterOOO[k].srIterId[i]][iterOOO[k].id+2] = {str:'SR', color: 1}  
        }



        for(const iterO of iterOOO2){
          for(const f of iterO.fId){
            table[f][iterO.id+2].str = 'F'
            table[f][iterO.id+3].str = 'F'
            table[f][iterO.id+4].str = 'F'
            table[f][iterO.id+5].str = 'F'
            table[f][iterO.id+6].str = 'F'
          }
          for(let i = 0; i < iterO.rdStr.length; i++) 
            if(iterO.rdStr[i] !== ' ') 
              table[iterO.rdIterId[i]][iterO.id+2].str = 'R'
          for(let i = 0; i < iterO.aluStr.length; i++) 
            if(iterO.aluStr[i] !== ' ') {
              if(iter[iterO.aluIterId[i]].str[0] !== 'j')
                table[iterO.aluIterId[i]][iterO.id+2].str = 'E'
              else{table[iterO.aluIterId[i]][iterO.id+2].str = 'J'}
            }  
          for(let i = 0; i < iterO.smStr.length; i++) 
            if(iterO.smStr[i] !== ' '){ 
              table[iterO.smIterId[i]][iterO.id+2].str = 'SM'
              }
          for(let i = 0; i < iterO.srIterId.length; i++) 
            if(iterO.srIterId[i] !== ' ') 
              table[iterO.srIterId[i]][iterO.id+2].str = 'SR'  
        }
        let idT = 0
        for(let t = 0; t < table.length; t++){
        
          let s = 0
          if(t < 10 || t > 14)
          for( let i = 2; i< table[t].length; i++)
            if(table[t][i].str !== ' ') s = i
          if(s !== 0){
            table[t][s+1].str='C'
            table[t][s+2].str='W'
            let k = 1
            while(s+2+k < idT){
              table[t][s+2+k].str='W'
            k++
            }
            table[t][s+2+k].str='T'
            idT=s+2+k
          } 
        }
        return table
      },
      ci(iterIO){
        const table = []
        const end = (this.END < 50) ? 50 : this.END
        for(let i = 0; i < end; i++){
          const iter = iterIO[i]
          let strTable = [i, iter.strBuff]
          strTable = strTable.concat(iter.rdStr, iter.aluStr, iter.smStr) 
          strTable.push(iter.srStr)
          table.push(strTable)
        }
        return table     
      },
      ti(iterIO, iter){
        let table = []
        for(let i = 0; i < iter.length; i++){
          const strTable = [{str:i,color:0}, {str:iter[i].str,color:0}]
          for(let k = 0; k < this.END + 10; k++) strTable.push({str:' ', color: 0})
          table.push(strTable)
        }
        for(const iterO of iterIO){
          for(const f of iterO.fId){
            table[f][iterO.id+2].str = 'F'
            table[f][iterO.id+3].str = 'F'
            table[f][iterO.id+4].str = 'F'
            table[f][iterO.id+5].str = 'F'
            table[f][iterO.id+6].str = 'F'
          }
          for(let i = 0; i < iterO.rdStr.length; i++) 
            if(iterO.rdStr[i] !== ' ') 
              table[iterO.rdIterId[i]][iterO.id+2].str = 'R'
          for(let i = 0; i < iterO.aluStr.length; i++) 
            if(iterO.aluStr[i] !== ' ') {
              if(iter[iterO.aluIterId[i]].str[0] !== 'j')
                table[iterO.aluIterId[i]][iterO.id+2].str = 'E'
              else{table[iterO.aluIterId[i]][iterO.id+2].str = 'J'}
            }  
          for(let i = 0; i < iterO.smStr.length; i++) 
            if(iterO.smStr[i] !== ' '){ 
              table[iterO.smIterId[i]][iterO.id+2].str = 'SM'
              }
          for(let i = 0; i < iterO.srIterId.length; i++) 
            if(iterO.srIterId[i] !== ' ') 
              table[iterO.srIterId[i]][iterO.id+2].str = 'SR'  
        }
        let idT = 0
        for(let t = 0; t < table.length; t++){
          let s = 0
          for( let i = 2; i< table[t].length; i++)
            if(table[t][i].str !== ' ') s = i
          if(s !== 0){
            table[t][s+1].str='C'
            table[t][s+2].str='W'
            let k = 1
            while(s+2+k < idT){
              table[t][s+2+k].str='W'
            k++
            }
            table[t][s+2+k].str='T'
            idT=s+2+k
          } 
        }
        return table
      },
      tij(iterIO2,iterIO, iter){
        let table = []
        for(let i = 0; i < iter.length; i++){
          const strTable = [{str:i,color:0}, {str:iter[i].str,color:0}]
          for(let k = 0; k < this.END + 10; k++) strTable.push({str:' ', color: 0})
          table.push(strTable)
        }
        for(let k = 0; k <this.JO+1; k++){
          for(let g = 0; g < iterIO[k].fId.length; g++)
            if(iterIO[k].fId[g] > 9)
              for(let h = 2; h < 7; h++)
                if(iterIO[k].id+h < this.JO + 1)
                table[iterIO[k].fId[g]][iterIO[k].id+h] = {str:'F', color: 1}
            
          for(let i = 0; i < iterIO[k].rdStr.length; i++) 
            if(iterIO[k].rdStr[i] !== ' ' && iterIO[k].rdIterId[i] > 9) 
              table[iterIO[k].rdIterId[i]][iterIO[k].id+2] = {str:'R', color: 1}
          for(let i = 0; i < iterIO[k].aluStr.length; i++) 
            if(iterIO[k].aluStr[i] !== ' ' && iterIO[k].aluIterId[i] > 9) {
              if(iter[iterIO[k].aluIterId[i]].str[0] !== 'j')
                table[iterIO[k].aluIterId[i]][iterIO[k].id+2] = {str:'E', color: 1}
              else{table[iterIO[k].aluIterId[i]][iterIO[k].id+2] = {str:'J', color: 1}}
            }  
          for(let i = 0; i < iterIO[k].smStr.length; i++) 
            if(iterIO[k].smStr[i] !== ' ' && iterIO[k].smIterId[i] > 9){ 
              table[iterIO[k].smIterId[i]][iterIO[k].id+2] = {str:'SM', color: 1}
              }
          for(let i = 0; i < iterIO[k].srIterId.length; i++) 
            if(iterIO[k].srIterId[i] !== ' ' && iterIO[k].srIterId[i] > 9) 
              table[iterIO[k].srIterId[i]][iterIO[k].id+2] = {str:'SR', color: 1}  
        }



        for(const iterO of iterIO2){
          for(const f of iterO.fId){
            table[f][iterO.id+2].str = 'F'
            table[f][iterO.id+3].str = 'F'
            table[f][iterO.id+4].str = 'F'
            table[f][iterO.id+5].str = 'F'
            table[f][iterO.id+6].str = 'F'
          }
          for(let i = 0; i < iterO.rdStr.length; i++) 
            if(iterO.rdStr[i] !== ' ') 
              table[iterO.rdIterId[i]][iterO.id+2].str = 'R'
          for(let i = 0; i < iterO.aluStr.length; i++) 
            if(iterO.aluStr[i] !== ' ') {
              if(iter[iterO.aluIterId[i]].str[0] !== 'j')
                table[iterO.aluIterId[i]][iterO.id+2].str = 'E'
              else{table[iterO.aluIterId[i]][iterO.id+2].str = 'J'}
            }  
          for(let i = 0; i < iterO.smStr.length; i++) 
            if(iterO.smStr[i] !== ' '){ 
              table[iterO.smIterId[i]][iterO.id+2].str = 'SM'
              }
          for(let i = 0; i < iterO.srIterId.length; i++) 
            if(iterO.srIterId[i] !== ' ') 
              table[iterO.srIterId[i]][iterO.id+2].str = 'SR'  
        }
        let idT = 0
        for(let t = 0; t < table.length; t++){
        
          let s = 0
          if(t < 10 || t > 14)
          for( let i = 2; i< table[t].length; i++)
            if(table[t][i].str !== ' ') s = i
          if(s !== 0){
            table[t][s+1].str='C'
            table[t][s+2].str='W'
            let k = 1
            while(s+2+k < idT){
              table[t][s+2+k].str='W'
            k++
            }
            table[t][s+2+k].str='T'
            idT=s+2+k
          } 
        }
        return table
      },
      special(){
        this.SN = 7
        const codes3 = this.codes3()
        const iter3  = this.iter(codes3)
        const iterOOO = this.iterOOO(iter3, codes3)
        const iterIO = this.iterIO(iter3, codes3)
        this.OOO = iterOOO.length - 10
        this.InO = iterIO.length - 10
      },
      codes3(){
        const codes = []
        let id = 0
        for(let k = 0; k < 5; k++)
          for(let n = 1; n < 5; n++)
            for(let i = 0; i < Code.length; i++){
              const strCode = {id: id++,
              str : Code[i] +' '+ MemReg[this.VA][i] + Num[k][i] +','+ MemReg[this.VA][i + 50] + Num[n][i] + ' ',
              vol : 0,
              type : Code[i][0],
              aNum : Num[k][i],
              bNum : Num[n][i],
              aType : MemReg[this.VA][i],
              bType : MemReg[this.VA][i + 50],
              lat : Latency[i]
            }
          if(strCode.aType === 'r' && strCode.bType === 'r') strCode.vol = Volrr[i]
          if(strCode.aType === 'r' && strCode.bType === 'm') strCode.vol = Volrm[i]
          if(strCode.aType === 'm' && strCode.bType === 'r') strCode.vol = Volmr[i]
          if(strCode.aType === 'm' && strCode.bType === 'm') strCode.vol = Volmm[i]
          strCode.str+=strCode.vol
          codes.push(strCode)
        }
        return codes
      }
    },
    computed: { 
      buttonColor: function() {
        let result = [];
        for (var i = 0; i< 6; i++){
          if (this.activeButton == i){
            result.push('#bbb');
          } else {
            result.push('');
          }
        }
        return result;
      }
    }
}).mount('#app')




