import sys

with open('src/lib/pdf-generator.ts', 'r', encoding='utf-8') as f:
    code = f.read()

# Add muraqebeenIzzan
code = code.replace(
    '{ l: "Bhai Saab Izzan", v: event.bhaiSaabIzzan },',
    '{ l: "Bhai Saab Izzan", v: event.bhaiSaabIzzan },\n    { l: "Muraqebeen Izzan", v: event.muraqebeenIzzan },'
)

# Add isChecklist param
code = code.replace(
    'transactionId?: string;\n  },\n) => {',
    'transactionId?: string;\n  },\n  isChecklist: boolean = false,\n) => {'
)

# Rename LAGAT DETAILS
code = code.replace(
    'doc.text("LAGAT DETAILS", margin, currentY);',
    'doc.text(isChecklist ? "EVENT CHECKLIST" : "LAGAT DETAILS", margin, currentY);'
)

# Table 1: General Items
code = code.replace(
    '''    const genRows = generalItems.map((i) => [
      i.label,
      i.quantity,
      i.rate,
      i.total,
    ]);''',
    '''    const genRows = isChecklist
        ? generalItems.map((i) => [i.label, "       ", ""])
        : generalItems.map((i) => [
            i.label,
            i.quantity,
            i.rate,
            i.total,
          ]);'''
)

code = code.replace(
    'const depositBoxSpace = 40;',
    'const depositBoxSpace = isChecklist ? 0 : 40;'
)

code = code.replace(
    'head: [["General Item", "Qty", "Rate", "Amount"]],',
    'head: isChecklist ? [["Item", "Verified", "Comments"]] : [["General Item", "Qty", "Rate", "Amount"]],'
)

code = code.replace(
    '''      columnStyles: {
        0: { fontStyle: "bold", cellWidth: "auto" },
        1: { cellWidth: 10, halign: "center" },
        2: { cellWidth: 18, halign: "center" },
        3: { fontStyle: "bold", cellWidth: 20, halign: "right" },
      },''',
    '''      columnStyles: isChecklist ? {
        0: { fontStyle: "bold", cellWidth: "auto" },
        1: { cellWidth: 20, halign: "center" },
        2: { cellWidth: 35, halign: "left" },
      } : {
        0: { fontStyle: "bold", cellWidth: "auto" },
        1: { cellWidth: 10, halign: "center" },
        2: { cellWidth: 18, halign: "center" },
        3: { fontStyle: "bold", cellWidth: 20, halign: "right" },
      },'''
)

# Table 2: Hall Items
code = code.replace(
    'const hallRows = hallItems.map((i) => [i.label, i.total]);',
    'const hallRows = isChecklist ? hallItems.map((i) => [i.label, "       ", ""]) : hallItems.map((i) => [i.label, i.total]);'
)

code = code.replace(
    'head: [["Hall Charges", "Amount"]],',
    'head: isChecklist ? [["Hall Checks", "Verified", "Comments"]] : [["Hall Charges", "Amount"]],'
)

code = code.replace(
    '''        columnStyles: {
          0: { fontStyle: "bold", cellWidth: "auto" },
          1: { fontStyle: "bold", cellWidth: 20, halign: "right" },
        },''',
    '''        columnStyles: isChecklist ? {
          0: { fontStyle: "bold", cellWidth: "auto" },
          1: { cellWidth: 20, halign: "center" },
          2: { cellWidth: 35, halign: "left" },
        } : {
          0: { fontStyle: "bold", cellWidth: "auto" },
          1: { fontStyle: "bold", cellWidth: 20, halign: "right" },
        },'''
)

# Grand total block
code = code.replace(
    '''    // Grand Total Row (Full Width spanning tables space)
    doc.setFillColor(241, 245, 249); // Slate-100 header style''',
    '''    if (!isChecklist) {
      // Grand Total Row (Full Width spanning tables space)
      doc.setFillColor(241, 245, 249); // Slate-100 header style'''
)

code = code.replace(
    '''      doc.setTextColor(30, 41, 59);
      doc.text(paymentText, margin + 25, paymentY);
    }
  } else {''',
    '''      doc.setTextColor(30, 41, 59);
      doc.text(paymentText, margin + 25, paymentY);
    }
    }
  } else {'''
)

code = code.replace(
    'head: [["Item", "Qty", "Rate", "Amount"]],',
    'head: isChecklist ? [["Item", "Verified", "Comments"]] : [["Item", "Qty", "Rate", "Amount"]],'
)

code = code.replace(
    'margin: { right: 45 },',
    'margin: { right: isChecklist ? margin : 45 },'
)

# Deposit box
code = code.replace(
    '''  // -- Deposit Box (Manual Draw) --
  // Drawn to the right
  const boxWidthForDep = 35;''',
    '''  if (!isChecklist) {
    // -- Deposit Box (Manual Draw) --
    // Drawn to the right
    const boxWidthForDep = 35;'''
)

code = code.replace(
    '''  if (pdfData?.deposit) {
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text(pdfData.deposit, boxX + boxWidthForDep / 2, boxY + boxH / 2 + 6, {
      align: "center",
    });
  }

  // -- Footer / Signatures --''',
    '''  if (pdfData?.deposit) {
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text(pdfData.deposit, boxX + boxWidthForDep / 2, boxY + boxH / 2 + 6, {
      align: "center",
    });
  }
  }

  // -- Footer / Signatures --'''
)

with open('src/lib/pdf-generator.ts', 'w', encoding='utf-8') as f:
    f.write(code)
