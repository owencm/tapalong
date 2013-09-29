//
//  ActivityTableCell.m
//  Activities
//
//  Created by Owen Campbell-Moore on 27/07/2013.
//  Copyright (c) 2013 A&O. All rights reserved.
//

#import "ActivityTableCell.h"
#import "GlobalColors.h"

@implementation ActivityTableCell

- (id)initWithCoder:(NSCoder *)aDecoder
{
    self = [super initWithCoder:aDecoder];
    if (self) {
        //Init here doesn't work
    }
    return self;
}

- (void)setSelected:(BOOL)selected animated:(BOOL)animated
{
    [super setSelected:selected animated:animated];
}

// For the love of god please tidy me
-(void)refreshLayout
{
    [self.activityLabel sizeToFit];
    
    int padding = 8;
    
    int titleOffset = self.activityLabel.frame.size.height + self.activityLabel.frame.origin.y;
    
    CGRect activityFrame = self.activityLabel.frame;
    
    CGRect oldFrame = self.userImage.frame;
    [self.userImage setFrame: CGRectMake(oldFrame.origin.x, activityFrame.origin.y + (activityFrame.size.height/2) - oldFrame.size.height / 2, oldFrame.size.width, oldFrame.size.height)];
    
    oldFrame = self.divider.frame;
    [self.divider setFrame: CGRectMake(oldFrame.origin.x, titleOffset + padding, oldFrame.size.width, oldFrame.size.height)];
    
    oldFrame = self.viewDetailsButton.frame;
    CGRect dividerFrame = self.divider.frame;
    [self.viewDetailsButton setFrame: CGRectMake(oldFrame.origin.x, oldFrame.origin.y, oldFrame.size.width, dividerFrame.origin.y - oldFrame.origin.y)];
    
    oldFrame = self.tapAlongButton.frame;
    [self.tapAlongButton setFrame: CGRectMake(oldFrame.origin.x, titleOffset + 2*padding, oldFrame.size.width, oldFrame.size.height)];
    
    int buttonOffset = self.tapAlongButton.frame.size.height + self.tapAlongButton.frame.origin.y;
 
    oldFrame = self.cardBackgroundView.frame;
    [self.cardBackgroundView setFrame: CGRectMake(oldFrame.origin.x, oldFrame.origin.y, oldFrame.size.width, buttonOffset+padding - oldFrame.origin.y + 1)];
    
    // TODO: Move me to the init
    UIImage *cardBackground = [[UIImage imageNamed:@"cardBackground.png"] resizableImageWithCapInsets:UIEdgeInsetsMake(2.0, 2.0, 3.0, 2.0)];
    self.cardBackgroundView.image = cardBackground;
    
    // TODO: Move me to the init
    UIColor *textBlueColor = [[GlobalColors sharedGlobal] textBlueColor];
    [self.tapAlongButton setTitleColor:textBlueColor forState:UIControlStateNormal];
    [self.tapAlongButton setTitleColor:textBlueColor forState:UIControlStateHighlighted];
//    [self.tapAlongButton setBackgroundImage: forState:]
}

@end
