//
//  ActivityTableCell.m
//  Activities
//
//  Created by Owen Campbell-Moore on 27/07/2013.
//  Copyright (c) 2013 A&O. All rights reserved.
//

// TODO: Set colors of buttons programatically

#import "ActivityTableCell.h"

@implementation ActivityTableCell

- (id)initWithCoder:(NSCoder *)aDecoder
{
    self = [super initWithCoder:aDecoder];
    if (self) {
        self.autoresizingMask = UIViewAutoresizingFlexibleHeight;
        self.clipsToBounds = YES;
    }
    return self;
}

- (void)setSelected:(BOOL)selected animated:(BOOL)animated
{
    [super setSelected:selected animated:animated];
}

-(void)refreshLayout
{
    [self.activityLabel sizeToFit];
    
    int titleBottomPadding = 6;
    int buttonHeight = 20;
    int buttonBottomPadding = 10;
    int titleOffset = self.activityLabel.frame.size.height + self.activityLabel.frame.origin.y;
    
    CGRect oldFrame = self.tapAlongButton.frame;
    [self.tapAlongButton setFrame: CGRectMake(oldFrame.origin.x, titleOffset + titleBottomPadding, oldFrame.size.width, oldFrame.size.height)];
    
    self.cellHeight = titleOffset + titleBottomPadding + buttonHeight + buttonBottomPadding;
    
}

@end
